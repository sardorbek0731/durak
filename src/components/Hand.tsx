import type { Card as CardData } from "../types";
import { sameCard } from "../game/deck";
import { fanOverlap, fanStyle } from "./fan";
import Card from "./Card";

interface Props {
  hand: CardData[];
  isPlayable: (c: CardData) => boolean;
  selected: CardData | null;
  onPick: (c: CardData) => void;
}

export default function Hand({ hand, isPlayable, selected, onPick }: Props) {
  return (
    <div className="hand" style={fanOverlap(hand.length)}>
      {hand.map((c, i) => {
        const ok = isPlayable(c);
        return (
          <div
            className="slot"
            key={`${c.suit}${c.rank}`}
            style={fanStyle(i, hand.length)}
          >
            <Card
              card={c}
              playable={ok}
              selected={!!selected && sameCard(selected, c)}
              onClick={ok ? () => onPick(c) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
