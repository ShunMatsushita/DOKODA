import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  ROOM_TIMEOUT,
} from 'dokoda-shared';
import { RoomManager } from './room.js';
import { GameEngine } from './game.js';
import { setupSocketEvents } from './events.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: isProduction
    ? undefined
    : {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
});

// ヘルスチェック用エンドポイント
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 本番環境: クライアントの静的ファイルを配信
if (isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

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
  console.log(`環境: ${isProduction ? '本番' : '開発'}`);
  console.log(`ルームタイムアウト: ${ROOM_TIMEOUT / 1000 / 60}分`);
});
