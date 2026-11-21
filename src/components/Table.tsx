import type { Pair } from "../types";
import Card from "./Card";

interface Props {
  table: Pair[];
  targets: Set<number>; // himoyachi urishi mumkin bo'lgan hujum kartalari
  onTarget: (index: number) => void;
}

export default function Table({ table, targets, onTarget }: Props) {
  if (table.length === 0) return <div className="table empty">Stol bo'sh</div>;
  return (
    <div className="table">
      {table.map((p, i) => (
        <div className="pair" key={i}>
          <Card
            card={p.attack}
            target={targets.has(i)}
            onClick={targets.has(i) ? () => onTarget(i) : undefined}
          />
          {p.defense && <Card card={p.defense} className="def" />}
        </div>
      ))}
    </div>
  );
}