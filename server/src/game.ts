import { Server } from 'socket.io';
import {
  Card,
  GameState,
  Player,
  MatchResult,
  ServerToClientEvents,
  ClientToServerEvents,
  generateCards,
  shuffleCards,
  shuffleSymbolsInCards,
  MIN_PLAYERS,
  COUNTDOWN_SECONDS,
  getMinCards,
} from 'dokoda-shared';
import { Room, ServerPlayer, RoomManager } from './room.js';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

export class GameEngine {
  constructor(
    private io: TypedIO,
    private roomManager: RoomManager
  ) {}

  /** カウントダウン → ゲーム開始 */
  startGame(room: Room): { ok: boolean; error?: string } {
    if (room.phase !== 'lobby') {
      return { ok: false, error: 'ゲームは既に開始されています' };
    }

    // タイムアタックは1人でもOK、それ以外は2人以上
    const minPlayers = room.settings.mode === 'timeAttack' ? 1 : MIN_PLAYERS;
    if (room.players.size < minPlayers) {
      return { ok: false, error: `最低${minPlayers}人必要です` };
    }

    room.phase = 'countdown';
    room.mode = room.settings.mode;
    room.lastActivity = Date.now();

    this.broadcastRoomUpdate(room);

    let count = COUNTDOWN_SECONDS;
    this.io.to(room.code).emit('game:countdown', count);

    room.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        this.io.to(room.code).emit('game:countdown', count);
      } else {
        if (room.countdownTimer) {
          clearInterval(room.countdownTimer);
          room.countdownTimer = null;
        }
        // ルームが空でないことを確認
        if (room.players.size === 0) return;
        this.dealAndStart(room);
      }
    }, 1000);

    return { ok: true };
  }

  private dealAndStart(room: Room): void {
    let cards = shuffleSymbolsInCards(shuffleCards(generateCards()));

    // カード枚数制限（最小枚数を保証）
    const minCards = getMinCards(room.settings.mode, room.players.size);
    if (room.settings.cardCount > 0 && room.settings.cardCount < cards.length) {
      const count = Math.max(room.settings.cardCount, minCards);
      cards = cards.slice(0, count);
    }

    room.phase = 'playing';
    room.lastMatch = null;
    room.startedAt = Date.now();
    room.totalCards = cards.length;
    room.clearedCards = 0;
    room.finishedAt = 0;

    const mode = room.settings.mode;
    if (mode === 'tower') {
      this.dealTowerMode(room, cards);
    } else if (mode === 'well') {
      this.dealWellMode(room, cards);
    } else if (mode === 'timeAttack') {
      this.dealTimeAttackMode(room, cards);
    }

    // タイムアタックの制限時間タイマー
    if (mode === 'timeAttack') {
      room.timeAttackTimer = setTimeout(() => {
        if (room.phase === 'playing') {
          this.io.to(room.code).emit('game:timeUp');
          this.finishGame(room);
        }
      }, room.settings.timeLimitSec * 1000);
    }

    this.broadcastRoomUpdate(room);
    this.sendGameStateToAll(room);
  }

  /** Towerモード: 中央に1枚、残りをプレイヤーに均等に配る（余りはラウンドロビン） */
  private dealTowerMode(room: Room, cards: Card[]): void {
    room.centerCard = cards[0];
    room.drawPile = [];

    const remaining = cards.slice(1);
    const playerArray = Array.from(room.players.values());
    const playerCount = playerArray.length;

    // 初期化
    for (const player of playerArray) {
      player.hand = [];
      player.score = 0;
      player.cooldownUntil = 0;
    }

    // ラウンドロビンで1枚ずつ配布（余りも均等に分配）
    for (let i = 0; i < remaining.length; i++) {
      playerArray[i % playerCount].hand.push(remaining[i]);
    }

    for (const player of playerArray) {
      player.cardCount = player.hand.length;
    }
  }

  /** Wellモード: 各プレイヤーに1枚、残りを山札に */
  private dealWellMode(room: Room, cards: Card[]): void {
    const playerArray = Array.from(room.players.values());

    room.centerCard = cards[0];
    let idx = 1;

    for (const player of playerArray) {
      player.hand = [cards[idx]];
      player.cardCount = 1;
      player.score = 0;
      player.cooldownUntil = 0;
      idx++;
    }

    room.drawPile = cards.slice(idx);
  }

  /** タイムアタックモード: 中央1枚 + 全員共通の山札 */
  private dealTimeAttackMode(room: Room, cards: Card[]): void {
    room.centerCard = cards[0];
    room.drawPile = cards.slice(1);

    // 各プレイヤーに山札の先頭1枚を配る
    const playerArray = Array.from(room.players.values());
    for (const player of playerArray) {
      if (room.drawPile.length > 0) {
        player.hand = [room.drawPile.shift()!];
      } else {
        player.hand = [];
      }
      player.cardCount = player.hand.length;
      player.score = 0;
      player.cooldownUntil = 0;
    }
  }

  /** プレイヤーのクレーム（シンボル一致宣言）を処理 */
  handleClaim(room: Room, playerId: string, symbolId: number): void {
    if (room.phase !== 'playing') return;

    const player = room.players.get(playerId);
    if (!player) return;

    const now = Date.now();
    if (now < player.cooldownUntil) return;
    if (player.hand.length === 0) return;
    if (!room.centerCard) return;

    const playerTopCard = player.hand[0];
    const onPlayerCard = playerTopCard.symbols.includes(symbolId);
    const onCenterCard = room.centerCard.symbols.includes(symbolId);

    if (!onPlayerCard || !onCenterCard) {
      player.cooldownUntil = now + room.settings.penaltyCooldown;
      this.io.to(playerId).emit('game:wrong', {
        cooldownMs: room.settings.penaltyCooldown,
      });
      return;
    }

    // 正解
    if (room.mode === 'tower') {
      this.handleTowerMatch(room, player, symbolId);
    } else if (room.mode === 'well') {
      this.handleWellMatch(room, player, symbolId);
    } else if (room.mode === 'timeAttack') {
      this.handleTimeAttackMatch(room, player, symbolId);
    }

    room.lastActivity = Date.now();
  }

  private handleTowerMatch(room: Room, player: ServerPlayer, symbolId: number): void {
    const playedCard = player.hand.shift()!;
    room.centerCard = playedCard;
    player.cardCount = player.hand.length;
    player.score++;
    room.clearedCards++;

    const result: MatchResult = {
      playerId: player.id,
      playerName: player.name,
      symbolId,
      timestamp: Date.now(),
    };
    room.lastMatch = result;

    this.io.to(room.code).emit('game:match', result);

    const isFinished = Array.from(room.players.values()).some((p) => p.hand.length === 0);
    if (isFinished) {
      this.finishGame(room);
    } else {
      this.sendGameStateToAll(room);
    }
  }

  private handleWellMatch(room: Room, player: ServerPlayer, symbolId: number): void {
    player.hand.push(room.centerCard!);
    player.score++;
    room.clearedCards++;

    const result: MatchResult = {
      playerId: player.id,
      playerName: player.name,
      symbolId,
      timestamp: Date.now(),
    };
    room.lastMatch = result;

    this.io.to(room.code).emit('game:match', result);

    if (room.drawPile.length > 0) {
      room.centerCard = room.drawPile.shift()!;
      for (const p of room.players.values()) {
        p.cardCount = p.hand.length;
      }
      this.sendGameStateToAll(room);
    } else {
      for (const p of room.players.values()) {
        p.cardCount = p.hand.length;
      }
      this.finishGame(room);
    }
  }

  /** タイムアタック: プレイヤーのカードが中央へ、山札から新しい1枚を補充 */
  private handleTimeAttackMatch(room: Room, player: ServerPlayer, symbolId: number): void {
    const playedCard = player.hand.shift()!;
    room.centerCard = playedCard;
    player.score++;
    room.clearedCards++;

    // 山札から補充
    if (room.drawPile.length > 0) {
      player.hand = [room.drawPile.shift()!];
    }
    player.cardCount = player.hand.length;

    const result: MatchResult = {
      playerId: player.id,
      playerName: player.name,
      symbolId,
      timestamp: Date.now(),
    };
    room.lastMatch = result;

    this.io.to(room.code).emit('game:match', result);

    // 全員の手札がなく山札もない → 全クリア
    const allEmpty = Array.from(room.players.values()).every((p) => p.hand.length === 0) && room.drawPile.length === 0;
    if (allEmpty) {
      this.finishGame(room);
    } else {
      this.sendGameStateToAll(room);
    }
  }

  private finishGame(room: Room): void {
    room.phase = 'finished';
    room.finishedAt = Date.now();

    if (room.timeAttackTimer) {
      clearTimeout(room.timeAttackTimer);
      room.timeAttackTimer = null;
    }

    const players: Player[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      cardCount: p.hand.length,
      connected: p.connected,
      isHost: p.isHost,
    }));

    if (room.mode === 'tower') {
      players.sort((a, b) => a.cardCount - b.cardCount);
    } else {
      players.sort((a, b) => b.score - a.score);
    }

    this.io.to(room.code).emit('game:finished', players);
    this.sendGameStateToAll(room);
    this.broadcastRoomUpdate(room);
  }

  getGameStateForPlayer(room: Room, playerId: string): GameState {
    const player = room.players.get(playerId);

    const players: Player[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      cardCount: p.hand.length,
      connected: p.connected,
      isHost: p.isHost,
    }));

    return {
      phase: room.phase,
      mode: room.mode,
      centerCard: room.centerCard,
      myCard: player && player.hand.length > 0 ? player.hand[0] : null,
      myCardCount: player ? player.hand.length : 0,
      drawPileCount: room.drawPile.length,
      players,
      lastMatch: room.lastMatch,
      startedAt: room.startedAt,
      timeLimitSec: room.mode === 'timeAttack' ? room.settings.timeLimitSec : 0,
      totalCards: room.totalCards,
      clearedCards: room.clearedCards,
      finishedAt: room.finishedAt,
    };
  }

  private sendGameStateToAll(room: Room): void {
    for (const player of room.players.values()) {
      const state = this.getGameStateForPlayer(room, player.socketId);
      this.io.to(player.socketId).emit('game:state', state);
    }
  }

  private broadcastRoomUpdate(room: Room): void {
    const roomInfo = this.roomManager.getRoomInfo(room);
    this.io.to(room.code).emit('room:updated', roomInfo);
  }
}
