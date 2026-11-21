import type { Card, Rank, Suit } from "../types";
import { RANKS, SUITS } from "../types";

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

// Fisher-Yates: haqiqiy tasodifiy aralashtirish
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sameCard = (a: Card, b: Card) =>
  a.suit === b.suit && a.rank === b.rank;

// Kozir kartasi deck[0] da, kozir mastini shundan olamiz
export function dealNewGame(): {
  deck: Card[];
  trump: Suit;
  hands: [Card[], Card[]];
} {
  const deck = shuffle(createDeck());
  const trump = deck[0].suit;
  const h1 = deck.splice(-6);
  const h2 = deck.splice(-6);
  return { deck, trump, hands: [h1, h2] };
}

// Himoya kartasi hujum kartasini uradimi?
export function canBeat(attack: Card, defense: Card, trump: Suit): boolean {
  if (defense.suit === attack.suit) return defense.rank > attack.rank;
  return defense.suit === trump && attack.suit !== trump;
}

// Qo'lni tartiblash: avval kozir bo'lmaganlar, keyin kozir, har biri o'sish tartibida
export function sortHand(hand: Card[], trump: Suit): Card[] {
  const weight = (c: Card) => (c.suit === trump ? 100 : 0) + c.rank;
  return [...hand].sort(
    (a, b) => weight(a) - weight(b) || a.suit.localeCompare(b.suit),
  );
}

export const RANK_LABEL: Record<Rank, string> = {
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

export const isRed = (suit: Suit) => suit === "H" || suit === "D";
