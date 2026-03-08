import { Server, Socket } from 'socket.io';
import {
  GameSettings,
  ServerToClientEvents,
  ClientToServerEvents,
  MIN_PLAYERS,
  MAX_PENALTY_COOLDOWN,
  TOTAL_CARDS,
  MIN_TIME_LIMIT_SEC,
  MAX_TIME_LIMIT_SEC,
  getMinCards,
} from 'dokoda-shared';
import { RoomManager } from './room.js';
import { GameEngine } from './game.js';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketEvents(
  io: TypedIO,
  roomManager: RoomManager,
  gameEngine: GameEngine
): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[接続] ${socket.id}`);

    // --- ルーム作成 ---
    socket.on('room:create', (playerName, callback) => {
      if (!playerName || typeof playerName !== 'string') {
        callback({ ok: false, error: '名前を入力してください' });
        return;
      }

      const trimmedName = playerName.trim();
      if (trimmedName.length === 0 || trimmedName.length > 20) {
        callback({ ok: false, error: '名前は1〜20文字で入力してください' });
        return;
      }

      const existingRoom = roomManager.getRoomBySocketId(socket.id);
      if (existingRoom) {
        callback({ ok: false, error: '既にルームに参加しています' });
        return;
      }

      const room = roomManager.createRoom(socket, trimmedName);
      const roomInfo = roomManager.getRoomInfo(room);
      io.to(room.code).emit('room:updated', roomInfo);

      callback({ ok: true, code: room.code });
      console.log(`[ルーム作成] ${room.code} by ${trimmedName}`);
    });

    // --- ルーム参加 ---
    socket.on('room:join', (code, playerName, callback) => {
      if (!code || typeof code !== 'string') {
        callback({ ok: false, error: 'ルームコードを入力してください' });
        return;
      }

      if (!playerName || typeof playerName !== 'string') {
        callback({ ok: false, error: '名前を入力してください' });
        return;
      }

      const trimmedName = playerName.trim();
      if (trimmedName.length === 0 || trimmedName.length > 20) {
        callback({ ok: false, error: '名前は1〜20文字で入力してください' });
        return;
      }

      const trimmedCode = code.trim().toUpperCase();
      if (trimmedCode.length !== 4) {
        callback({ ok: false, error: 'ルームコードは4文字です' });
        return;
      }

      const existingRoom = roomManager.getRoomBySocketId(socket.id);
      if (existingRoom) {
        callback({ ok: false, error: '既にルームに参加しています' });
        return;
      }

      const result = roomManager.joinRoom(socket, trimmedCode, trimmedName);
      if (!result.ok) {
        callback({ ok: false, error: result.error });
        return;
      }

      const roomInfo = roomManager.getRoomInfo(result.room!);
      io.to(result.room!.code).emit('room:updated', roomInfo);

      callback({ ok: true });
      console.log(`[ルーム参加] ${trimmedCode} by ${trimmedName}`);
    });

    // --- ゲーム設定変更 (ホストのみ) ---
    socket.on('room:settings', (settings: GameSettings) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;
      if (room.hostId !== socket.id) return;
      if (room.phase !== 'lobby') return;

      // バリデーション
      const validModes = ['tower', 'well', 'timeAttack'];
      if (!validModes.includes(settings.mode)) return;

      const cooldown = Math.max(0, Math.min(MAX_PENALTY_COOLDOWN, Math.round(settings.penaltyCooldown)));
      const minCards = getMinCards(settings.mode, room.players.size);
      let cardCount = Math.max(0, Math.min(TOTAL_CARDS, Math.round(settings.cardCount)));
      if (cardCount > 0 && cardCount < minCards) cardCount = minCards;
      const timeLimitSec = Math.max(MIN_TIME_LIMIT_SEC, Math.min(MAX_TIME_LIMIT_SEC, Math.round(settings.timeLimitSec)));

      room.settings = {
        mode: settings.mode,
        penaltyCooldown: cooldown,
        cardCount,
        timeLimitSec,
      };
      room.mode = settings.mode;
      room.lastActivity = Date.now();

      const roomInfo = roomManager.getRoomInfo(room);
      io.to(room.code).emit('room:updated', roomInfo);
    });

    // --- ゲーム開始 ---
    socket.on('game:start', () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('error', 'ルームが見つかりません');
        return;
      }

      if (room.hostId !== socket.id) {
        socket.emit('error', 'ホストのみがゲームを開始できます');
        return;
      }

      const result = gameEngine.startGame(room);
      if (!result.ok) {
        socket.emit('error', result.error!);
      }

      console.log(`[ゲーム開始] ${room.code} mode=${room.settings.mode}`);
    });

    // --- シンボルクレーム ---
    socket.on('game:claim', (symbolId: number) => {
      if (typeof symbolId !== 'number' || !Number.isInteger(symbolId) || symbolId < 0) {
        return;
      }

      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      gameEngine.handleClaim(room, socket.id, symbolId);
    });

    // --- ロビーに戻る ---
    socket.on('game:backToLobby', () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;
      if (room.hostId !== socket.id) return;
      if (room.phase !== 'finished') return;

      roomManager.backToLobby(room);
      const roomInfo = roomManager.getRoomInfo(room);
      io.to(room.code).emit('room:updated', roomInfo);
    });

    // --- 切断 ---
    socket.on('disconnect', () => {
      console.log(`[切断] ${socket.id}`);

      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        const { room, leftPlayer } = result;

        if (room.players.size > 0) {
          const roomInfo = roomManager.getRoomInfo(room);
          io.to(room.code).emit('room:updated', roomInfo);

          // カウントダウン中に人数不足になったらロビーに戻す
          if (room.phase === 'countdown') {
            const minForStart = room.mode === 'timeAttack' ? 1 : MIN_PLAYERS;
            if (room.players.size < minForStart) {
              if (room.countdownTimer) {
                clearInterval(room.countdownTimer);
                room.countdownTimer = null;
              }
              room.phase = 'lobby';
              const updatedInfo = roomManager.getRoomInfo(room);
              io.to(room.code).emit('room:updated', updatedInfo);
            }
          }

          const minPlayersForGame = room.mode === 'timeAttack' ? 1 : MIN_PLAYERS;
          if (room.phase === 'playing' && room.players.size < minPlayersForGame) {
            room.phase = 'finished';
            room.finishedAt = Date.now();
            if (room.timeAttackTimer) {
              clearTimeout(room.timeAttackTimer);
              room.timeAttackTimer = null;
            }
            const players = Array.from(room.players.values()).map((p) => ({
              id: p.id,
              name: p.name,
              score: p.score,
              cardCount: p.hand.length,
              connected: p.connected,
              isHost: p.isHost,
            }));
            io.to(room.code).emit('game:finished', players);

            for (const p of room.players.values()) {
              const state = gameEngine.getGameStateForPlayer(room, p.socketId);
              io.to(p.socketId).emit('game:state', state);
            }

            const updatedRoomInfo = roomManager.getRoomInfo(room);
            io.to(room.code).emit('room:updated', updatedRoomInfo);
          }
        }

        console.log(`[退出] ${leftPlayer.name} from ${room.code}`);
      }
    });
  });
}
