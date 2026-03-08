import { describe, it, expect } from 'vitest';
import {
  ORDER,
  SYMBOLS_PER_CARD,
  TOTAL_SYMBOLS,
  TOTAL_CARDS,
  MAX_PLAYERS,
  getMinCards,
} from '../constants.js';

describe('constants', () => {
  it('ORDER is 7', () => {
    expect(ORDER).toBe(7);
  });

  it('SYMBOLS_PER_CARD = ORDER + 1', () => {
    expect(SYMBOLS_PER_CARD).toBe(ORDER + 1);
  });

  it('TOTAL_SYMBOLS = ORDER^2 + ORDER + 1', () => {
    expect(TOTAL_SYMBOLS).toBe(ORDER * ORDER + ORDER + 1);
  });

  it('TOTAL_CARDS = TOTAL_SYMBOLS', () => {
    expect(TOTAL_CARDS).toBe(TOTAL_SYMBOLS);
  });
});

describe('getMinCards', () => {
  describe('tower mode', () => {
    it('requires 1 center + 1 per player', () => {
      expect(getMinCards('tower', 2)).toBe(3);
      expect(getMinCards('tower', 4)).toBe(5);
      expect(getMinCards('tower', 8)).toBe(9);
    });
  });

  describe('well mode', () => {
    it('requires 1 center + 1 per player + 1 draw pile', () => {
      expect(getMinCards('well', 2)).toBe(4);  // 1 + 2 + 1
      expect(getMinCards('well', 4)).toBe(6);  // 1 + 4 + 1
      expect(getMinCards('well', 8)).toBe(10); // 1 + 8 + 1
    });
  });

  describe('timeAttack mode', () => {
    it('requires 1 center + 1 per player + 1 draw pile', () => {
      expect(getMinCards('timeAttack', 1)).toBe(3);  // 1 + 1 + 1
      expect(getMinCards('timeAttack', 2)).toBe(4);  // 1 + 2 + 1
      expect(getMinCards('timeAttack', 4)).toBe(6);  // 1 + 4 + 1
      expect(getMinCards('timeAttack', 8)).toBe(10); // 1 + 8 + 1
    });

    it('scales with player count (not fixed at 3)', () => {
      // Regression: was always returning 3
      expect(getMinCards('timeAttack', 8)).toBeGreaterThan(3);
    });
  });

  describe('edge cases', () => {
    it('unknown mode falls back to tower formula', () => {
      expect(getMinCards('unknown', 2)).toBe(3);
    });

    it('min cards never exceeds total cards for max players', () => {
      for (const mode of ['tower', 'well', 'timeAttack']) {
        expect(getMinCards(mode, MAX_PLAYERS)).toBeLessThanOrEqual(TOTAL_CARDS);
      }
    });
  });
});
