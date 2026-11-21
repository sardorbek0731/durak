export type Suit = "S" | "H" | "D" | "C"; // pika, chirva, bubi, krest
export type Rank = 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANKS: Rank[] = [6, 7, 8, 9, 10, 11, 12, 13, 14];

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type PlayerId = "host" | "guest";

// stoldagi bitta juftlik: hujum kartasi va (urilgan bo'lsa) himoya kartasi
export interface Pair {
  attack: Card;
  defense?: Card;
}

// attack  = hujumchi karta tashlaydi
// defend  = himoyachi uradi yoki "Olaman" deydi
// taking  = himoyachi olishga rozi bo'ldi, hujumchi yana tashlashi mumkin
// finished = o'yin tugadi
export type Phase = "attack" | "defend" | "taking" | "finished";

// Faqat host'da saqlanadi (hamma kartalar shu yerda)
export interface GameState {
  deck: Card[]; // oxirgi element = tepadagi karta, deck[0] = kozir kartasi
  trump: Suit;
  hands: Record<PlayerId, Card[]>;
  table: Pair[];
  attacker: PlayerId;
  phase: Phase;
  loser: PlayerId | null; // durak
  draw: boolean; // ikkalasi ham kartasiz qolsa
}

// Har bir o'yinchiga yuboriladigan ko'rinish (raqibning kartalari yo'q)
export interface GameView {
  you: PlayerId;
  myHand: Card[];
  opponentCount: number;
  deckCount: number;
  trump: Suit;
  trumpCard: Card | null; // koloda tugagan bo'lsa null
  table: Pair[];
  attacker: PlayerId;
  phase: Phase;
  loser: PlayerId | null;
  draw: boolean;
}

// Guest -> Host
export type Action =
  | { kind: "attack"; card: Card } // birinchi hujum yoki tashlash
  | { kind: "defend"; attackIndex: number; card: Card }
  | { kind: "take" } // "Olaman"
  | { kind: "done" }; // "Bito" (hujumchi) yoki "Tugatdim" (olish paytida)

export type Message =
  | { type: "action"; action: Action }
  | { type: "view"; view: GameView }
  | { type: "newgame" }
  | { type: "error"; text: string }; // host -> guest (yurish rad etildi)
