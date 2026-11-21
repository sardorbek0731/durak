import type { CSSProperties } from "react";
import type { Card as CardData } from "../types";
import { RANK_LABEL, SUIT_SYMBOL, isRed } from "../game/deck";

interface Props {
  card?: CardData; // yo'q bo'lsa, kartaning orqasi ko'rinadi
  playable?: boolean;
  selected?: boolean;
  target?: boolean;
  small?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function Card({
  card,
  playable,
  selected,
  target,
  small,
  className = "",
  style,
  onClick,
}: Props) {
  const cls = [
    "card",
    card ? (isRed(card.suit) ? "red" : "black") : "back",
    card?.rank === 14 && "ace",
    playable && "playable",
    selected && "selected",
    target && "target",
    small && "small",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      style={style}
      disabled={!onClick}
      onClick={onClick}
      aria-label={
        card ? `${RANK_LABEL[card.rank]} ${SUIT_SYMBOL[card.suit]}` : "Karta"
      }
    >
      {card && (
        <>
          <span className="corner">
            <span>{RANK_LABEL[card.rank]}</span>
            <span>{SUIT_SYMBOL[card.suit]}</span>
          </span>
          <span className="center">{SUIT_SYMBOL[card.suit]}</span>
          <span className="corner br" aria-hidden="true">
            <span>{RANK_LABEL[card.rank]}</span>
            <span>{SUIT_SYMBOL[card.suit]}</span>
          </span>
        </>
      )}
    </button>
  );
}
