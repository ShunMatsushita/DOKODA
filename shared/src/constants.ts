/** 射影平面の位数 (素数) */
export const ORDER = 7;

/** 1枚のカードに含まれるシンボル数 = ORDER + 1 */
export const SYMBOLS_PER_CARD = ORDER + 1; // 8

/** 総シンボル数 = ORDER^2 + ORDER + 1 */
export const TOTAL_SYMBOLS = ORDER * ORDER + ORDER + 1; // 57

/** 総カード数 = ORDER^2 + ORDER + 1 */
export const TOTAL_CARDS = TOTAL_SYMBOLS; // 57

/** 最大プレイヤー数 */
export const MAX_PLAYERS = 8;

/** 最小プレイヤー数 */
export const MIN_PLAYERS = 2;

/** ルームコードの長さ */
export const ROOM_CODE_LENGTH = 4;

/** 不正解時のデフォルトクールダウン (ms) */
export const DEFAULT_PENALTY_COOLDOWN = 1000;

/** お手付きクールダウン最大値 (ms) */
export const MAX_PENALTY_COOLDOWN = 5000;

/** カウントダウン秒数 */
export const COUNTDOWN_SECONDS = 3;

/** タイムアタック制限時間デフォルト (秒) */
export const DEFAULT_TIME_LIMIT_SEC = 120;

/** タイムアタック制限時間の範囲 (秒) */
export const MIN_TIME_LIMIT_SEC = 30;
export const MAX_TIME_LIMIT_SEC = 300;

/** 各モードのカード最小枚数を計算 */
export function getMinCards(mode: string, playerCount: number): number {
  switch (mode) {
    case 'tower':
      // 中央1枚 + 各プレイヤー最低1枚
      return 1 + playerCount;
    case 'well':
      // 中央1枚 + 各プレイヤー1枚 + 山札最低1枚
      return 1 + playerCount + 1;
    case 'timeAttack':
      // 中央1枚 + 各プレイヤー1枚 + 山札最低1枚
      return 1 + playerCount + 1;
    default:
      return 1 + playerCount;
  }
}

/** ルームの自動削除時間 (ms) - 30分 */
export const ROOM_TIMEOUT = 30 * 60 * 1000;

/** 再接続猶予時間 (ms) - 30秒 */
export const RECONNECT_GRACE_MS = 30 * 1000;

/** カスタムシンボル: 最大データURLサイズ (バイト) - 約200KB */
export const MAX_CUSTOM_SYMBOL_SIZE = 200 * 1024;

/** カスタムシンボル: 同時置換上限 */
export const MAX_CUSTOM_SYMBOLS = 57;
