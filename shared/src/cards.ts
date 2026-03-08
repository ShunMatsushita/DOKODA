import { Card } from './types.js';
import { ORDER, TOTAL_CARDS, SYMBOLS_PER_CARD } from './constants.js';

/**
 * 射影平面に基づくカード生成アルゴリズム
 * 位数 n (素数) の射影平面から、以下の性質を持つカードセットを生成:
 * - 総カード数: n^2 + n + 1
 * - 各カードのシンボル数: n + 1
 * - 任意の2枚のカードは必ず1つだけ共通シンボルを持つ
 */
export function generateCards(n: number = ORDER): Card[] {
  const cards: number[][] = [];

  // カード0: 「無限遠直線」 [0, 1, 2, ..., n]
  cards.push(Array.from({ length: n + 1 }, (_, i) => i));

  // カード 1 ~ n: 各「傾き」に対応
  for (let i = 0; i < n; i++) {
    const card = [0]; // シンボル0を共有（カード0との共通シンボル）
    for (let j = 0; j < n; j++) {
      card.push(n + 1 + i * n + j);
    }
    cards.push(card);
  }

  // カード (n+1) ~ (n^2+n): アフィン平面の点
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const card = [1 + i]; // シンボル(1+i)を共有（カード0との共通シンボル）
      for (let k = 0; k < n; k++) {
        card.push(n + 1 + k * n + ((i * k + j) % n));
      }
      cards.push(card);
    }
  }

  return cards.map((symbols, id) => ({ id, symbols }));
}

/**
 * 2枚のカードの共通シンボルを見つける
 */
export function findCommonSymbol(card1: Card, card2: Card): number | null {
  const set = new Set(card1.symbols);
  for (const s of card2.symbols) {
    if (set.has(s)) return s;
  }
  return null;
}

/**
 * カード生成の正当性を検証
 */
export function validateCards(cards: Card[]): boolean {
  if (cards.length !== TOTAL_CARDS) return false;

  for (const card of cards) {
    if (card.symbols.length !== SYMBOLS_PER_CARD) return false;
  }

  // 任意の2枚のカードが正確に1つの共通シンボルを持つか検証
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const set = new Set(cards[i].symbols);
      let commonCount = 0;
      for (const s of cards[j].symbols) {
        if (set.has(s)) commonCount++;
      }
      if (commonCount !== 1) return false;
    }
  }

  return true;
}

/**
 * カード配列をシャッフル (Fisher-Yates)
 */
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
