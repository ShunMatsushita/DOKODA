import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  ROOM_TIMEOUT,
} from 'dokoda-shared';
import { RoomManager } from './room.js';
import { GameEngine } from './game.js';
import { setupSocketEvents } from './events.js';

const PORT = 3001;

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ヘルスチェック用エンドポイント
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// マネージャー・エンジンの初期化
const roomManager = new RoomManager();
const gameEngine = new GameEngine(io, roomManager);

// Socket.ioイベントハンドラーのセットアップ
setupSocketEvents(io, roomManager, gameEngine);

// 非アクティブなルームの定期クリーンアップ（5分間隔）
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const cleaned = roomManager.cleanupInactiveRooms();
  if (cleaned > 0) {
    console.log(`[クリーンアップ] ${cleaned}件のルームを削除しました`);
  }
}, CLEANUP_INTERVAL);

// サーバー起動
httpServer.listen(PORT, () => {
  console.log(`DOKODA サーバー起動: http://localhost:${PORT}`);
  console.log(`ルームタイムアウト: ${ROOM_TIMEOUT / 1000 / 60}分`);
});
