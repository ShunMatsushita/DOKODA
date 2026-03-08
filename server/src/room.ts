import crypto from 'node:crypto';
import { Socket } from 'socket.io';
import {
  Card,
  Player,
  GamePhase,
  GameMode,
  GameSettings,
  RoomInfo,
  MatchResult,
  ServerToClientEvents,
  ClientToServerEvents,
  MAX_PLAYERS,
  ROOM_CODE_LENGTH,
  ROOM_TIMEOUT,
  DEFAULT_PENALTY_COOLDOWN,
  DEFAULT_TIME_LIMIT_SEC,
  MAX_CUSTOM_SYMBOL_SIZE,
  MAX_CUSTOM_SYMBOLS,
  TOTAL_SYMBOLS,
  RECONNECT_GRACE_MS,
} from 'dokoda-shared';

/** サーバー側のプレイヤー情報（クライアントに送らない情報を含む） */
export interface ServerPlayer extends Player {
  socketId: string;
  hand: Card[];
  cooldownUntil: number;
  reconnectToken: string;
}

/** サーバー側のルーム情報 */
export interface Room {
  code: string;
  players: Map<string, ServerPlayer>;
  phase: GamePhase;
  mode: GameMode;
  settings: GameSettings;
  hostId: string;
  centerCard: Card | null;
  drawPile: Card[];
  lastMatch: MatchResult | null;
  lastActivity: number;
  startedAt: number;
  totalCards: number;
  clearedCards: number;
  finishedAt: number;
  timeAttackTimer: ReturnType<typeof setTimeout> | null;
  countdownTimer: ReturnType<typeof setInterval> | null;
  customSymbols: Map<number, string>; // symbolId -> base64 data URL
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>; // socketId -> grace timer
  password: string; // 空文字列 = パスワードなし
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export class RoomManager {
  private rooms = new Map<string, Room>();

  /** ルームを作成し、作成者をホストとして追加 */
  createRoom(socket: TypedSocket, playerName: string, password: string = ''): { room: Room; token: string } {
    const code = this.generateRoomCode();
    const token = this.generateToken();

    const player: ServerPlayer = {
      id: socket.id,
      socketId: socket.id,
      name: playerName,
      score: 0,
      cardCount: 0,
      connected: true,
      isHost: true,
      hand: [],
      cooldownUntil: 0,
      reconnectToken: token,
    };

    const room: Room = {
      code,
      players: new Map([[socket.id, player]]),
      phase: 'lobby',
      mode: 'tower',
      settings: {
        mode: 'tower',
        penaltyCooldown: DEFAULT_PENALTY_COOLDOWN,
        cardCount: 0,
        timeLimitSec: DEFAULT_TIME_LIMIT_SEC,
      },
      hostId: socket.id,
      centerCard: null,
      drawPile: [],
      lastMatch: null,
      lastActivity: Date.now(),
      startedAt: 0,
      totalCards: 0,
      clearedCards: 0,
      finishedAt: 0,
      timeAttackTimer: null,
      countdownTimer: null,
      customSymbols: new Map(),
      disconnectTimers: new Map(),
      password,
    };

    this.rooms.set(code, room);
    socket.join(code);

    return { room, token };
  }

  /** 既存のルームに参加 */
  joinRoom(
    socket: TypedSocket,
    code: string,
    playerName: string,
    password: string = ''
  ): { ok: boolean; room?: Room; needPassword?: boolean; token?: string; error?: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return { ok: false, error: 'ルームが見つかりません' };
    }

    if (room.phase !== 'lobby') {
      return { ok: false, error: 'ゲームが既に開始されています' };
    }

    if (room.players.size >= MAX_PLAYERS) {
      return { ok: false, error: 'ルームが満員です' };
    }

    // パスワード検証
    if (room.password && room.password !== password) {
      return { ok: false, needPassword: true, error: 'パスワードが違います' };
    }

    // 同じ名前のプレイヤーがいないかチェック
    for (const p of room.players.values()) {
      if (p.name === playerName) {
        return { ok: false, error: 'その名前は既に使われています' };
      }
    }

    const token = this.generateToken();
    const player: ServerPlayer = {
      id: socket.id,
      socketId: socket.id,
      name: playerName,
      score: 0,
      cardCount: 0,
      connected: true,
      isHost: false,
      hand: [],
      cooldownUntil: 0,
      reconnectToken: token,
    };

    room.players.set(socket.id, player);
    room.lastActivity = Date.now();
    socket.join(code);

    return { ok: true, room, token };
  }

  /** ゲーム終了後にロビーに戻す */
  backToLobby(room: Room): void {
    room.phase = 'lobby';
    room.centerCard = null;
    room.drawPile = [];
    room.lastMatch = null;
    room.lastActivity = Date.now();
    room.startedAt = 0;
    room.totalCards = 0;
    room.clearedCards = 0;
    room.finishedAt = 0;
    if (room.timeAttackTimer) {
      clearTimeout(room.timeAttackTimer);
      room.timeAttackTimer = null;
    }
    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
      room.countdownTimer = null;
    }

    // 切断中プレイヤーを除外（ロビーに戻る時は切断者は除外）
    for (const [sid, player] of room.players) {
      if (!player.connected) {
        room.players.delete(sid);
        const timer = room.disconnectTimers.get(sid);
        if (timer) {
          clearTimeout(timer);
          room.disconnectTimers.delete(sid);
        }
      }
    }

    for (const player of room.players.values()) {
      player.hand = [];
      player.cardCount = 0;
      player.score = 0;
      player.cooldownUntil = 0;
    }
  }

  /** プレイヤーを切断状態にする（猶予期間後に除外） */
  disconnectPlayer(socketId: string, onGraceExpired: (room: Room, player: ServerPlayer) => void): { room: Room; player: ServerPlayer } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.get(socketId);
      if (!player) continue;

      player.connected = false;
      room.lastActivity = Date.now();

      // 猶予タイマーを設定
      const timer = setTimeout(() => {
        room.disconnectTimers.delete(socketId);
        // まだ切断中なら実際に除外
        if (room.players.has(socketId) && !room.players.get(socketId)!.connected) {
          this.removePlayer(socketId);
          onGraceExpired(room, player);
        }
      }, RECONNECT_GRACE_MS);

      room.disconnectTimers.set(socketId, timer);

      return { room, player };
    }

    return null;
  }

  /** プレイヤーをルームから完全除外 */
  removePlayer(socketId: string): { room: Room; leftPlayer: ServerPlayer } | null {
    for (const [code, room] of this.rooms) {
      const player = room.players.get(socketId);
      if (!player) continue;

      // 猶予タイマーをクリア
      const timer = room.disconnectTimers.get(socketId);
      if (timer) {
        clearTimeout(timer);
        room.disconnectTimers.delete(socketId);
      }

      room.players.delete(socketId);
      room.lastActivity = Date.now();

      // ルームが空（全員接続済みのプレイヤーがいない）かチェック
      const connectedCount = Array.from(room.players.values()).filter(p => p.connected).length;
      if (room.players.size === 0 || (connectedCount === 0 && room.disconnectTimers.size === 0)) {
        // 全タイマーをクリア
        for (const t of room.disconnectTimers.values()) clearTimeout(t);
        room.disconnectTimers.clear();
        if (room.countdownTimer) {
          clearInterval(room.countdownTimer);
          room.countdownTimer = null;
        }
        if (room.timeAttackTimer) {
          clearTimeout(room.timeAttackTimer);
          room.timeAttackTimer = null;
        }
        this.rooms.delete(code);
        return { room, leftPlayer: player };
      }

      // ホストが抜けた場合は接続中プレイヤーをホストに昇格
      if (room.hostId === socketId) {
        const nextHost = Array.from(room.players.values()).find(p => p.connected)
          || room.players.values().next().value!;
        nextHost.isHost = true;
        room.hostId = nextHost.socketId;
      }

      return { room, leftPlayer: player };
    }

    return null;
  }

  /** 再接続: トークンでプレイヤーを検索し、ソケットを紐付け直す */
  rejoinRoom(
    socket: TypedSocket,
    code: string,
    token: string
  ): { ok: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return { ok: false, error: 'ルームが見つかりません' };
    }

    // トークンで切断中のプレイヤーを検索
    let targetPlayer: ServerPlayer | null = null;
    let oldSocketId: string | null = null;

    for (const [sid, player] of room.players) {
      if (player.reconnectToken === token) {
        targetPlayer = player;
        oldSocketId = sid;
        break;
      }
    }

    if (!targetPlayer || !oldSocketId) {
      return { ok: false, error: '再接続情報が見つかりません' };
    }

    // 猶予タイマーをキャンセル
    const timer = room.disconnectTimers.get(oldSocketId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(oldSocketId);
    }

    // ソケットIDを更新
    room.players.delete(oldSocketId);
    targetPlayer.id = socket.id;
    targetPlayer.socketId = socket.id;
    targetPlayer.connected = true;
    room.players.set(socket.id, targetPlayer);

    // ホストIDも更新
    if (room.hostId === oldSocketId) {
      room.hostId = socket.id;
    }

    room.lastActivity = Date.now();
    socket.join(room.code);

    return { ok: true, room };
  }

  /** ルームを取得 */
  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  /** ソケットIDからルームを検索 */
  getRoomBySocketId(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return undefined;
  }

  /** ルーム情報をクライアント向けに変換 */
  getRoomInfo(room: Room): RoomInfo {
    const players: Player[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      cardCount: p.cardCount,
      connected: p.connected,
      isHost: p.isHost,
    }));

    return {
      code: room.code,
      players,
      phase: room.phase,
      mode: room.mode,
      settings: room.settings,
      customSymbols: Object.fromEntries(room.customSymbols),
      hasPassword: room.password.length > 0,
    };
  }

  /** 非アクティブなルームを削除 */
  cleanupInactiveRooms(): number {
    const now = Date.now();
    let count = 0;

    for (const [code, room] of this.rooms) {
      if (now - room.lastActivity > ROOM_TIMEOUT) {
        this.rooms.delete(code);
        count++;
      }
    }

    return count;
  }

  /** カスタムシンボルをアップロード */
  uploadSymbol(
    room: Room,
    socketId: string,
    symbolId: number,
    dataUrl: string
  ): { ok: boolean; error?: string } {
    if (room.hostId !== socketId) {
      return { ok: false, error: 'ホストのみがシンボルを変更できます' };
    }
    if (room.phase !== 'lobby') {
      return { ok: false, error: 'ロビー中のみ変更できます' };
    }
    if (!Number.isInteger(symbolId) || symbolId < 0 || symbolId >= TOTAL_SYMBOLS) {
      return { ok: false, error: '無効なシンボルIDです' };
    }
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return { ok: false, error: '無効な画像形式です' };
    }
    if (dataUrl.length > MAX_CUSTOM_SYMBOL_SIZE) {
      return { ok: false, error: '画像サイズが大きすぎます（200KB以下）' };
    }
    if (room.customSymbols.size >= MAX_CUSTOM_SYMBOLS && !room.customSymbols.has(symbolId)) {
      return { ok: false, error: 'カスタムシンボルの上限に達しました' };
    }

    room.customSymbols.set(symbolId, dataUrl);
    room.lastActivity = Date.now();
    return { ok: true };
  }

  /** カスタムシンボルを削除 */
  deleteSymbol(room: Room, socketId: string, symbolId: number): boolean {
    if (room.hostId !== socketId || room.phase !== 'lobby') return false;
    room.customSymbols.delete(symbolId);
    room.lastActivity = Date.now();
    return true;
  }

  /** 全カスタムシンボルをリセット */
  resetSymbols(room: Room, socketId: string): boolean {
    if (room.hostId !== socketId || room.phase !== 'lobby') return false;
    room.customSymbols.clear();
    room.lastActivity = Date.now();
    return true;
  }

  /** ランダムな再接続トークンを生成 */
  private generateToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /** ランダムなルームコードを生成 */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // I,Oは紛らわしいので除外
    let code: string;

    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));

    return code;
  }
}
