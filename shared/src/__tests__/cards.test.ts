import { describe, it, expect } from 'vitest';
import { generateCards, findCommonSymbol, validateCards, shuffleCards } from '../cards.js';
import { ORDER, TOTAL_CARDS, SYMBOLS_PER_CARD, TOTAL_SYMBOLS } from '../constants.js';

describe('generateCards', () => {
  const cards = generateCards();

  it('generates correct number of cards', () => {
    expect(cards.length).toBe(TOTAL_CARDS);
    expect(cards.length).toBe(57);
  });

  it('each card has correct number of symbols', () => {
    for (const card of cards) {
      expect(card.symbols.length).toBe(SYMBOLS_PER_CARD);
      expect(card.symbols.length).toBe(8);
    }
  });

  it('all symbol IDs are within valid range', () => {
    for (const card of cards) {
      for (const s of card.symbols) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThan(TOTAL_SYMBOLS);
      }
    }
  });

  it('no duplicate symbols within a single card', () => {
    for (const card of cards) {
      const unique = new Set(card.symbols);
      expect(unique.size).toBe(card.symbols.length);
    }
  });

  it('any two cards share exactly one common symbol', () => {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const set = new Set(cards[i].symbols);
        let count = 0;
        for (const s of cards[j].symbols) {
          if (set.has(s)) count++;
        }
        expect(count).toBe(1);
      }
    }
  });

  it('cards have sequential IDs', () => {
    cards.forEach((card, idx) => {
      expect(card.id).toBe(idx);
    });
  });

  it('works with smaller order (order 2)', () => {
    const small = generateCards(2);
    expect(small.length).toBe(7); // 2^2 + 2 + 1
    for (const card of small) {
      expect(card.symbols.length).toBe(3); // 2 + 1
    }
    // Verify projective plane property
    for (let i = 0; i < small.length; i++) {
      for (let j = i + 1; j < small.length; j++) {
        const set = new Set(small[i].symbols);
        let count = 0;
        for (const s of small[j].symbols) {
          if (set.has(s)) count++;
        }
        expect(count).toBe(1);
      }
    }
  });
});

describe('findCommonSymbol', () => {
  const cards = generateCards();

  it('finds the common symbol between any two cards', () => {
    for (let i = 0; i < 10; i++) {
      for (let j = i + 1; j < 10; j++) {
        const common = findCommonSymbol(cards[i], cards[j]);
        expect(common).not.toBeNull();
        expect(cards[i].symbols).toContain(common);
        expect(cards[j].symbols).toContain(common);
      }
    }
  });

  it('returns null for cards with no common symbol', () => {
    const cardA = { id: 0, symbols: [100, 101, 102] };
    const cardB = { id: 1, symbols: [200, 201, 202] };
    expect(findCommonSymbol(cardA, cardB)).toBeNull();
  });
});

describe('validateCards', () => {
  it('returns true for valid card set', () => {
    const cards = generateCards();
    expect(validateCards(cards)).toBe(true);
  });

  it('returns false for wrong number of cards', () => {
    const cards = generateCards().slice(0, 10);
    expect(validateCards(cards)).toBe(false);
  });

  it('returns false for wrong number of symbols per card', () => {
    const cards = generateCards();
    cards[0] = { id: 0, symbols: [0, 1, 2] }; // Too few symbols
    expect(validateCards(cards)).toBe(false);
  });
});

describe('shuffleCards', () => {
  it('returns same number of cards', () => {
    const cards = generateCards();
    const shuffled = shuffleCards(cards);
    expect(shuffled.length).toBe(cards.length);
  });

  it('does not modify original array', () => {
    const cards = generateCards();
    const original = cards.map(c => c.id);
    shuffleCards(cards);
    expect(cards.map(c => c.id)).toEqual(original);
  });

  it('contains all original cards', () => {
    const cards = generateCards();
    const shuffled = shuffleCards(cards);
    const originalIds = new Set(cards.map(c => c.id));
    const shuffledIds = new Set(shuffled.map(c => c.id));
    expect(shuffledIds).toEqual(originalIds);
  });
});
