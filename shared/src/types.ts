/** カード */
export interface Card {
  id: number;
  symbols: number[]; // シンボルIDの配列
}

/** カード上のシンボル配置情報 */
export interface SymbolPlacement {
  symbolId: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

/** プレイヤー */
export interface Player {
  id: string;
  name: string;
  score: number;
  cardCount: number;
  connected: boolean;
  isHost: boolean;
}

/** ゲームモード */
export type GameMode = 'tower' | 'well' | 'timeAttack';

/** ゲームフェーズ */
export type GamePhase = 'lobby' | 'countdown' | 'playing' | 'finished';

/** ホストが設定可能なゲーム設定 */
export interface GameSettings {
  mode: GameMode;
  penaltyCooldown: number; // お手付き時のクールダウン (ms) 0〜5000
  cardCount: number; // 使用するカード枚数 (0=全て)
  timeLimitSec: number; // タイムアタック制限時間 (秒) 30〜300
}

/** クライアントに送信するゲーム状態 */
export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  centerCard: Card | null;
  myCard: Card | null;
  myCardCount: number;
  drawPileCount: number;
  players: Player[];
  lastMatch: MatchResult | null;
  startedAt: number; // ゲーム開始時刻 (ms)
  timeLimitSec: number; // 制限時間 (秒, 0=無制限)
  totalCards: number; // 使用した総カード枚数
  clearedCards: number; // クリア済みカード枚数
  finishedAt: number; // ゲーム終了時刻 (ms, 0=未終了)
}

/** マッチ結果 */
export interface MatchResult {
  playerId: string;
  playerName: string;
  symbolId: number;
  timestamp: number;
}

/** ルーム情報 */
export interface RoomInfo {
  code: string;
  players: Player[];
  phase: GamePhase;
  mode: GameMode;
  settings: GameSettings;
  customSymbols: Record<number, string>; // symbolId -> base64 data URL
  hasPassword: boolean;
}

// --- Socket.io イベント型定義 ---

export interface ServerToClientEvents {
  'room:updated': (room: RoomInfo) => void;
  'game:state': (state: GameState) => void;
  'game:match': (result: MatchResult) => void;
  'game:countdown': (count: number) => void;
  'game:finished': (players: Player[]) => void;
  'game:timeUp': () => void;
  'game:wrong': (data: { cooldownMs: number }) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'room:create': (playerName: string, password: string, callback: (response: { ok: boolean; code?: string; token?: string; error?: string }) => void) => void;
  'room:join': (code: string, playerName: string, password: string, callback: (response: { ok: boolean; needPassword?: boolean; token?: string; error?: string }) => void) => void;
  'room:rejoin': (code: string, token: string, callback: (response: { ok: boolean; error?: string }) => void) => void;
  'room:settings': (settings: GameSettings) => void;
  'room:uploadSymbol': (symbolId: number, dataUrl: string, callback: (response: { ok: boolean; error?: string }) => void) => void;
  'room:deleteSymbol': (symbolId: number) => void;
  'room:resetSymbols': () => void;
  'game:start': () => void;
  'game:claim': (symbolId: number) => void;
  'game:backToLobby': () => void;
}
