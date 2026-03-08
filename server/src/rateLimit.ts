/**
 * Socket.ioイベント用レート制限（スライディングウィンドウ方式）
 */

interface RateLimitConfig {
  /** ウィンドウ期間 (ms) */
  windowMs: number;
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number;
}

/** イベントごとのレート制限設定 */
const EVENT_LIMITS: Record<string, RateLimitConfig> = {
  // ゲーム中の操作（高頻度を許容）
  'game:claim': { windowMs: 1000, maxRequests: 10 },
  // ルーム操作（低頻度で十分）
  'room:create': { windowMs: 5000, maxRequests: 3 },
  'room:join': { windowMs: 5000, maxRequests: 5 },
  'room:settings': { windowMs: 1000, maxRequests: 5 },
  'game:start': { windowMs: 5000, maxRequests: 3 },
  'game:backToLobby': { windowMs: 3000, maxRequests: 3 },
  'room:uploadSymbol': { windowMs: 2000, maxRequests: 5 },
  'room:deleteSymbol': { windowMs: 1000, maxRequests: 5 },
  'room:resetSymbols': { windowMs: 3000, maxRequests: 3 },
};

/** デフォルト制限（未定義イベント用） */
const DEFAULT_LIMIT: RateLimitConfig = { windowMs: 1000, maxRequests: 10 };

/** ソケットごとのイベントタイムスタンプ記録 */
const socketTimestamps = new Map<string, Map<string, number[]>>();

/**
 * レート制限チェック
 * @returns true = 許可, false = レート超過
 */
export function checkRateLimit(socketId: string, event: string): boolean {
  const config = EVENT_LIMITS[event] ?? DEFAULT_LIMIT;
  const now = Date.now();

  let eventMap = socketTimestamps.get(socketId);
  if (!eventMap) {
    eventMap = new Map();
    socketTimestamps.set(socketId, eventMap);
  }

  let timestamps = eventMap.get(event);
  if (!timestamps) {
    timestamps = [];
    eventMap.set(event, timestamps);
  }

  // ウィンドウ外のタイムスタンプを除去
  const windowStart = now - config.windowMs;
  while (timestamps.length > 0 && timestamps[0] <= windowStart) {
    timestamps.shift();
  }

  if (timestamps.length >= config.maxRequests) {
    return false;
  }

  timestamps.push(now);
  return true;
}

/**
 * ソケット切断時にレート制限データをクリーンアップ
 */
export function cleanupRateLimit(socketId: string): void {
  socketTimestamps.delete(socketId);
}
