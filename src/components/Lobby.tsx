import { useState } from "react";
import type { CSSProperties } from "react";
import type { Card as CardData } from "../types";
import type { Mode } from "../hooks/useGame";
import Card from "./Card";

interface Props {
  mode: Mode;
  link: string;
  notice: string;
  failed: boolean;
  onHost: () => void;
}

// Eng past, o'rta va eng baland karta
const HERO: { card: CardData; x: number; r: number }[] = [
  { card: { suit: "D", rank: 6 }, x: -46, r: -12 },
  { card: { suit: "H", rank: 13 }, x: 0, r: 0 },
  { card: { suit: "S", rank: 14 }, x: 46, r: 12 },
];

export default function Lobby({ mode, link, notice, failed, onHost }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* nusxalab bo'lmasa, foydalanuvchi maydondan o'zi oladi */
    }
  };

  return (
    <main className="lobby">
      <div className="hero" aria-hidden="true">
        {HERO.map((h) => (
          <Card
            key={`${h.card.suit}${h.card.rank}`}
            card={h.card}
            style={
              { "--x": `${h.x}px`, "--r": `${h.r}deg` } as CSSProperties
            }
          />
        ))}
      </div>

      <h1>Durak</h1>
      <p className="sub">
        Do'stingiz bilan masofadan turib, ikki kishilik durak.
      </p>

      {mode === "menu" && (
        <button className="btn primary" onClick={onHost}>
          Do'st bilan o'ynash
        </button>
      )}

      {mode === "hosting" && link && (
        <div className="linkbox">
          <input
            readOnly
            value={link}
            aria-label="O'yin havolasi"
            onFocus={(e) => e.target.select()}
          />
          <button className="btn primary" onClick={copy}>
            {copied ? "Nusxalandi" : "Nusxa olish"}
          </button>
        </div>
      )}

      {notice && <p className="notice">{notice}</p>}

      {failed && (
        <button className="btn" onClick={() => location.reload()}>
          Qayta urinish
        </button>
      )}
    </main>
  );
}