/**
 * モバイル触覚フィードバック (Vibration API)
 * 対応ブラウザでのみ動作、非対応では何もしない
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** 正解マッチ: 短い1回 */
export function vibrateCorrect(): void {
  vibrate(40);
}

/** 不正解: 短い2連打 */
export function vibrateWrong(): void {
  vibrate([30, 50, 30]);
}

/** ゲーム開始 */
export function vibrateStart(): void {
  vibrate([50, 30, 50]);
}

/** ゲーム終了 */
export function vibrateFinish(): void {
  vibrate([80, 40, 80, 40, 80]);
}

/** カウントダウン: 短い1回 */
export function vibrateCountdown(): void {
  vibrate(20);
}
