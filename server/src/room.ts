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
} from 'dokoda-shared';

/** サーバー側のプレイヤー情報（クライアントに送らない情報を含む） */
export interface ServerPlayer extends Player {
  socketId: string;
  hand: Card[];
  cooldownUntil: number;
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
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export class RoomManager {
  private rooms = new Map<string, Room>();

  /** ルームを作成し、作成者をホストとして追加 */
  createRoom(socket: TypedSocket, playerName: string): Room {
    const code = this.generateRoomCode();

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
    };

    this.rooms.set(code, room);
    socket.join(code);

    return room;
  }

  /** 既存のルームに参加 */
  joinRoom(
    socket: TypedSocket,
    code: string,
    playerName: string
  ): { ok: boolean; room?: Room; error?: string } {
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

    // 同じ名前のプレイヤーがいないかチェック
    for (const p of room.players.values()) {
      if (p.name === playerName) {
        return { ok: false, error: 'その名前は既に使われています' };
      }
    }

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
    };

    room.players.set(socket.id, player);
    room.lastActivity = Date.now();
    socket.join(code);

    return { ok: true, room };
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

    for (const player of room.players.values()) {
      player.hand = [];
      player.cardCount = 0;
      player.score = 0;
      player.cooldownUntil = 0;
    }
  }

  /** プレイヤーがルームから退出（切断含む） */
  leaveRoom(socketId: string): { room: Room; leftPlayer: ServerPlayer } | null {
    for (const [code, room] of this.rooms) {
      const player = room.players.get(socketId);
      if (!player) continue;

      room.players.delete(socketId);
      room.lastActivity = Date.now();

      // ルームが空になったら削除
      if (room.players.size === 0) {
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

      // ホストが抜けた場合は次のプレイヤーをホストに昇格
      if (room.hostId === socketId) {
        const nextHost = room.players.values().next().value!;
        nextHost.isHost = true;
        room.hostId = nextHost.socketId;
      }

      return { room, leftPlayer: player };
    }

    return null;
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
