import { useState } from "react";
import type { Card as CardData } from "./types";
import { SUIT_SYMBOL, canBeat, isRed, sameCard } from "./game/deck";
import { canAddCard, otherPlayer } from "./game/rules";
import { useGame } from "./hooks/useGame";
import { fanOverlap, fanStyle } from "./components/fan";
import Card from "./components/Card";
import Hand from "./components/Hand";
import Table from "./components/Table";
import Lobby from "./components/Lobby";

export default function App() {
  const { mode, link, view, notice, failed, startHost, act, newGame } =
    useGame();
  const [picked, setPicked] = useState<CardData | null>(null);

  if (mode !== "playing" || !view) {
    return (
      <Lobby
        mode={mode}
        link={link}
        notice={notice}
        failed={failed}
        onHost={startHost}
      />
    );
  }

  const isAttacker = view.you === view.attacker;
  const over = view.phase === "finished";
  const undefended = view.table
    .map((p, i) => ({ p, i }))
    .filter((x) => !x.p.defense);
  const allDefended = view.table.length > 0 && undefended.length === 0;

  // Hozir asosiy harakatni kim qiladi: urish fazasida himoyachi, qolganida hujumchi
  const actor =
    view.phase === "defend" ? otherPlayer(view.attacker) : view.attacker;
  const myTurn = !over && actor === view.you;
  const oppTurn = !over && !myTurn;

  // bu karta stoldagi qaysi hujum kartalarini uradi
  const beats = (c: CardData) =>
    undefended
      .filter((x) => canBeat(x.p.attack, c, view.trump))
      .map((x) => x.i);

  const isPlayable = (c: CardData) => {
    if (over) return false;
    if (isAttacker) return canAddCard(view.table, view.opponentCount, c);
    return view.phase === "defend" && beats(c).length > 0;
  };

  // Tanlov faqat himoyachida, himoya fazasida va bir nechta nishon bo'lganda amal qiladi
  const sel =
    !isAttacker &&
    view.phase === "defend" &&
    picked &&
    view.myHand.some((c) => sameCard(c, picked)) &&
    beats(picked).length > 1
      ? picked
      : null;
  const targets = new Set(sel ? beats(sel) : []);

  const onPick = (c: CardData) => {
    if (isAttacker) {
      act({ kind: "attack", card: c });
      return;
    }
    const t = beats(c);
    if (t.length === 1) {
      act({ kind: "defend", attackIndex: t[0], card: c });
      setPicked(null);
    } else {
      setPicked(c);
    }
  };

  const onTarget = (index: number) => {
    if (!sel) return;
    act({ kind: "defend", attackIndex: index, card: sel });
    setPicked(null);
  };

  let status: string;
  if (over) {
    status = view.draw
      ? "Durang"
      : view.loser === view.you
        ? "Siz durak bo'ldingiz"
        : "Siz yutdingiz!";
  } else if (isAttacker) {
    status =
      view.phase === "taking"
        ? "Do'stingiz oladi. Yana karta qo'shing yoki «Tugatdim» ni bosing"
        : view.phase === "defend"
          ? "Do'stingiz uryapti. Xohlasangiz karta qo'shing"
          : view.table.length === 0
            ? "Sizning yurishingiz: karta tashlang"
            : "Hammasi urildi. «Bito» ni bosing yoki yana tashlang";
  } else {
    status =
      view.phase === "taking"
        ? "Siz olasiz. Do'stingiz karta qo'shishi mumkin"
        : view.phase === "defend"
          ? sel
            ? "Qaysi kartani urishni tanlang"
            : "Kartani bosib uring yoki «Olaman» ni bosing"
          : "Do'stingiz yurmoqda";
  }

  const tone = over
    ? view.draw
      ? "draw"
      : view.loser === view.you
        ? "lose"
        : "win"
    : myTurn
      ? "go"
      : "";

  const showBito = isAttacker && view.phase === "attack" && allDefended;
  const showDone = isAttacker && view.phase === "taking";
  const showTake = !isAttacker && view.phase === "defend";

  const oppCount = Math.min(view.opponentCount, 24);
  const trumpRed = isRed(view.trump) ? " red" : "";

  return (
    <main className="game">
      <section className={"seat opponent" + (oppTurn ? " active" : "")}>
        <div className="fan" style={fanOverlap(oppCount)}>
          {Array.from({ length: oppCount }, (_, i) => (
            <div className="slot" key={i} style={fanStyle(i, oppCount, true)}>
              <Card small />
            </div>
          ))}
        </div>
        <p className="who">
          {!over && (
            <span className={"role " + (isAttacker ? "def" : "atk")}>
              {isAttacker ? "Himoya" : "Hujum"}
            </span>
          )}
          <span>Do'stingiz · {view.opponentCount} ta karta</span>
        </p>
      </section>

      <section className="middle">
        <div className="deck" aria-label="Koloda">
          <div className="stack">
            {view.trumpCard ? (
              <>
                <Card card={view.trumpCard} className="trumpcard" small />
                {view.deckCount > 1 && <Card small />}
              </>
            ) : (
              <div className={"trumponly" + trumpRed}>
                {SUIT_SYMBOL[view.trump]}
              </div>
            )}
          </div>
          <p className="trump-label">
            <span className={"suit" + trumpRed}>{SUIT_SYMBOL[view.trump]}</span>{" "}
            kozir · {view.deckCount}
          </p>
        </div>
        <Table table={view.table} targets={targets} onTarget={onTarget} />
      </section>

      <section className="controls">
        <p className={("status " + tone).trim()} aria-live="polite">
          {status}
        </p>
        {notice && <p className="notice">{notice}</p>}
        <div className="buttons">
          {showBito && (
            <button
              className="btn primary"
              onClick={() => act({ kind: "done" })}
            >
              Bito
            </button>
          )}
          {showDone && (
            <button
              className="btn primary"
              onClick={() => act({ kind: "done" })}
            >
              Tugatdim
            </button>
          )}
          {showTake && (
            <button className="btn" onClick={() => act({ kind: "take" })}>
              Olaman
            </button>
          )}
          {over && (
            <button className="btn primary" onClick={newGame}>
              Yangi o'yin
            </button>
          )}
        </div>
      </section>

      <section className={"seat mine" + (myTurn ? " active" : "")}>
        <Hand
          hand={view.myHand}
          isPlayable={isPlayable}
          selected={sel}
          onPick={onPick}
        />
        <p className="who">
          {!over && (
            <span className={"role " + (isAttacker ? "atk" : "def")}>
              {isAttacker ? "Hujum" : "Himoya"}
            </span>
          )}
          <span>Sizda {view.myHand.length} ta karta</span>
        </p>
      </section>
    </main>
  );
}
