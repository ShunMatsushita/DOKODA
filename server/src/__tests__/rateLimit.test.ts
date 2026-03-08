import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit, cleanupRateLimit } from '../rateLimit.js';

describe('RateLimit (DoS対策)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 各テスト前にデータをクリア
    cleanupRateLimit('socket-1');
    cleanupRateLimit('socket-2');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('制限内のリクエストは許可される', () => {
      // room:create は 5秒間に3回まで
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
    });

    it('制限超過のリクエストは拒否される', () => {
      // room:create は 5秒間に3回まで
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(false);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(false);
    });

    it('ウィンドウ経過後にリクエストが再び許可される', () => {
      // room:create: 5秒ウィンドウ, 3回まで
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
      expect(checkRateLimit('socket-1', 'room:create')).toBe(false);

      // 5秒経過
      vi.advanceTimersByTime(5001);

      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
    });

    it('異なるソケットは独立してレート制限される', () => {
      // socket-1 が制限に達しても socket-2 は影響しない
      for (let i = 0; i < 3; i++) {
        checkRateLimit('socket-1', 'room:create');
      }
      expect(checkRateLimit('socket-1', 'room:create')).toBe(false);
      expect(checkRateLimit('socket-2', 'room:create')).toBe(true);
    });

    it('異なるイベントは独立してレート制限される', () => {
      // room:create が制限に達しても room:join は影響しない
      for (let i = 0; i < 3; i++) {
        checkRateLimit('socket-1', 'room:create');
      }
      expect(checkRateLimit('socket-1', 'room:create')).toBe(false);
      expect(checkRateLimit('socket-1', 'room:join')).toBe(true);
    });

    it('game:claim は1秒間に10回まで許可される', () => {
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit('socket-1', 'game:claim')).toBe(true);
      }
      expect(checkRateLimit('socket-1', 'game:claim')).toBe(false);

      // 1秒経過で回復
      vi.advanceTimersByTime(1001);
      expect(checkRateLimit('socket-1', 'game:claim')).toBe(true);
    });

    it('未定義イベントにはデフォルト制限が適用される', () => {
      // デフォルト: 1秒間に10回
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit('socket-1', 'unknown:event')).toBe(true);
      }
      expect(checkRateLimit('socket-1', 'unknown:event')).toBe(false);
    });
  });

  describe('大量リクエスト耐性 (DoS シミュレーション)', () => {
    it('大量の game:claim を送信しても制限を超えたリクエストはすべて拒否される', () => {
      let accepted = 0;
      let rejected = 0;

      // 1秒間に100回のクレームを試行
      for (let i = 0; i < 100; i++) {
        if (checkRateLimit('socket-1', 'game:claim')) {
          accepted++;
        } else {
          rejected++;
        }
      }

      expect(accepted).toBe(10);
      expect(rejected).toBe(90);
    });

    it('大量の room:create を送信しても制限を超えたリクエストはすべて拒否される', () => {
      let accepted = 0;
      let rejected = 0;

      for (let i = 0; i < 50; i++) {
        if (checkRateLimit('socket-1', 'room:create')) {
          accepted++;
        } else {
          rejected++;
        }
      }

      expect(accepted).toBe(3);
      expect(rejected).toBe(47);
    });

    it('複数ソケットからの同時攻撃でも各ソケットが独立して制限される', () => {
      const socketCount = 100;

      for (let s = 0; s < socketCount; s++) {
        const socketId = `attacker-${s}`;
        // 各ソケットから5回ずつ room:create を試行
        let accepted = 0;
        for (let i = 0; i < 5; i++) {
          if (checkRateLimit(socketId, 'room:create')) {
            accepted++;
          }
        }
        // 各ソケットは3回まで許可
        expect(accepted).toBe(3);

        cleanupRateLimit(socketId);
      }
    });

    it('長時間にわたる持続的な攻撃でもレート制限が機能し続ける', () => {
      let totalAccepted = 0;

      // 10秒間、100ms ごとに game:claim を5回送信
      for (let t = 0; t < 100; t++) {
        for (let i = 0; i < 5; i++) {
          if (checkRateLimit('socket-1', 'game:claim')) {
            totalAccepted++;
          }
        }
        vi.advanceTimersByTime(100);
      }

      // 10秒間で理論上最大 10回/秒 × 10秒 = 100回
      // 実際は500回試行しているので、100回前後が許可されるはず
      expect(totalAccepted).toBeLessThanOrEqual(110);
      expect(totalAccepted).toBeGreaterThanOrEqual(90);
    });
  });

  describe('cleanupRateLimit', () => {
    it('切断時にソケットのレート制限データが削除される', () => {
      // データを蓄積
      for (let i = 0; i < 3; i++) {
        checkRateLimit('socket-1', 'room:create');
      }
      expect(checkRateLimit('socket-1', 'room:create')).toBe(false);

      // クリーンアップ
      cleanupRateLimit('socket-1');

      // クリーンアップ後は再びリクエストが許可される
      expect(checkRateLimit('socket-1', 'room:create')).toBe(true);
    });

    it('存在しないソケットのクリーンアップはエラーにならない', () => {
      expect(() => cleanupRateLimit('nonexistent')).not.toThrow();
    });
  });
});
