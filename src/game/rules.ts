import type {
  Action,
  Card,
  GameState,
  GameView,
  Pair,
  PlayerId,
} from "../types";
import { canBeat, dealNewGame, sameCard, sortHand } from "./deck";

const HAND_SIZE = 6;
const MAX_TABLE = 6;

export const otherPlayer = (p: PlayerId): PlayerId =>
  p === "host" ? "guest" : "host";

export type Result =
  | { ok: true; state: GameState }
  | { ok: false; error: string };

// ---------- Yangi o'yin ----------

function lowestTrump(hand: Card[], trump: Card["suit"]): number {
  const ranks = hand.filter((c) => c.suit === trump).map((c) => c.rank);
  return ranks.length ? Math.min(...ranks) : Infinity;
}

export function createGame(): GameState {
  const { deck, trump, hands } = dealNewGame();
  const hostLow = lowestTrump(hands[0], trump);
  const guestLow = lowestTrump(hands[1], trump);
  // eng past kozirga ega bo'lgan boshlaydi; ikkalasida ham bo'lmasa, tasodifiy
  let attacker: PlayerId;
  if (hostLow === guestLow) attacker = Math.random() < 0.5 ? "host" : "guest";
  else attacker = hostLow < guestLow ? "host" : "guest";

  return {
    deck,
    trump,
    hands: { host: hands[0], guest: hands[1] },
    table: [],
    attacker,
    phase: "attack",
    loser: null,
    draw: false,
  };
}

// ---------- Yordamchi tekshiruvlar (UI ham ishlatadi) ----------

const undefendedCount = (s: GameState) =>
  s.table.filter((p) => !p.defense).length;
const allDefended = (s: GameState) =>
  s.table.length > 0 && undefendedCount(s) === 0;

// Hujumchi shu kartani stolga qo'sha oladimi? (ekran ham ishlatadi:
// canAddCard(view.table, view.opponentCount, card))
export function canAddCard(
  table: Pair[],
  defenderCount: number,
  card: Card,
): boolean {
  if (table.length === 0) return true; // birinchi hujum: istalgan karta
  if (table.length >= MAX_TABLE) return false;
  const undefended = table.filter((p) => !p.defense).length;
  if (undefended + 1 > defenderCount) return false;
  return table.some(
    (p) => p.attack.rank === card.rank || p.defense?.rank === card.rank,
  );
}

const hasLegalAdd = (s: GameState) =>
  s.hands[s.attacker].some((c) =>
    canAddCard(s.table, s.hands[otherPlayer(s.attacker)].length, c),
  );

// ---------- Raund tugashi ----------

function refill(s: GameState, p: PlayerId) {
  while (s.hands[p].length < HAND_SIZE && s.deck.length > 0) {
    s.hands[p].push(s.deck.pop()!);
  }
}

function endRound(s: GameState, took: boolean) {
  const attacker = s.attacker;
  const defender = otherPlayer(attacker);

  if (took) {
    for (const pair of s.table) {
      s.hands[defender].push(pair.attack);
      if (pair.defense) s.hands[defender].push(pair.defense);
    }
  }
  s.table = [];

  refill(s, attacker); // avval hujumchi, keyin himoyachi
  refill(s, defender);

  if (!took) s.attacker = defender; // muvaffaqiyatli himoya: rollar almashadi
  s.phase = "attack";

  // koloda tugagan bo'lsa, kartasi tugagan o'yinchi g'olib
  if (s.deck.length === 0) {
    const hostEmpty = s.hands.host.length === 0;
    const guestEmpty = s.hands.guest.length === 0;
    if (hostEmpty && guestEmpty) {
      s.phase = "finished";
      s.draw = true;
    } else if (hostEmpty || guestEmpty) {
      s.phase = "finished";
      s.loser = hostEmpty ? "guest" : "host";
    }
  }
}

// Hujumchi hech narsa qo'sha olmasa, raund o'zi tugaydi (qotib qolmaslik uchun)
function settle(s: GameState) {
  if (s.phase === "attack" && allDefended(s) && !hasLegalAdd(s))
    endRound(s, false);
  else if (s.phase === "taking" && !hasLegalAdd(s)) endRound(s, true);
}

// ---------- Harakatni qo'llash ----------

const fail = (error: string): Result => ({ ok: false, error });

export function applyAction(
  state: GameState,
  player: PlayerId,
  action: Action,
): Result {
  if (state.phase === "finished") return fail("O'yin tugagan");

  const s = structuredClone(state);
  const defender = otherPlayer(s.attacker);

  switch (action.kind) {
    case "attack": {
      if (player !== s.attacker) return fail("Hozir siz hujum qilmaysiz");
      const idx = s.hands[player].findIndex((c) => sameCard(c, action.card));
      if (idx === -1) return fail("Sizda bunday karta yo'q");
      if (!canAddCard(s.table, s.hands[defender].length, action.card))
        return fail("Bu kartani tashlab bo'lmaydi");
      s.hands[player].splice(idx, 1);
      s.table.push({ attack: action.card });
      if (s.phase === "attack") s.phase = "defend";
      break;
    }

    case "defend": {
      if (player !== defender) return fail("Hozir siz himoya qilmaysiz");
      if (s.phase !== "defend") return fail("Hozir urib bo'lmaydi");
      const pair = s.table[action.attackIndex];
      if (!pair || pair.defense) return fail("Bu kartani urib bo'lmaydi");
      const idx = s.hands[player].findIndex((c) => sameCard(c, action.card));
      if (idx === -1) return fail("Sizda bunday karta yo'q");
      if (!canBeat(pair.attack, action.card, s.trump))
        return fail("Bu karta urmaydi");
      s.hands[player].splice(idx, 1);
      pair.defense = action.card;
      if (allDefended(s)) s.phase = "attack";
      break;
    }

    case "take": {
      if (player !== defender) return fail("Hozir siz himoya qilmaysiz");
      if (s.phase !== "defend") return fail("Hozir olib bo'lmaydi");
      s.phase = "taking";
      break;
    }

    case "done": {
      if (player !== s.attacker) return fail("Bu tugmani hujumchi bosadi");
      if (s.phase === "attack" && allDefended(s))
        endRound(s, false); // Bito
      else if (s.phase === "taking")
        endRound(s, true); // do'sti olsin
      else return fail("Hozir tugatib bo'lmaydi");
      return { ok: true, state: s };
    }
  }

  settle(s);
  return { ok: true, state: s };
}

// ---------- Har bir o'yinchiga ko'rinish ----------

export function toView(s: GameState, player: PlayerId): GameView {
  return {
    you: player,
    myHand: sortHand(s.hands[player], s.trump),
    opponentCount: s.hands[otherPlayer(player)].length,
    deckCount: s.deck.length,
    trump: s.trump,
    trumpCard: s.deck.length > 0 ? s.deck[0] : null,
    table: s.table,
    attacker: s.attacker,
    phase: s.phase,
    loser: s.loser,
    draw: s.draw,
  };
}
