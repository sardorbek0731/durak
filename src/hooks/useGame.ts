import { useCallback, useEffect, useRef, useState } from "react";
import type { Action, GameState, GameView, PlayerId } from "../types";
import { applyAction, createGame, toView } from "../game/rules";
import { hostGame, joinGame, type Link } from "../network/peer";

export type Mode = "menu" | "hosting" | "joining" | "playing";

// Havola orqali kirilgan bo'lsa, id shu yerdan olinadi
const HASH_ID = location.hash.slice(1);

export function useGame() {
  const [mode, setMode] = useState<Mode>(HASH_ID ? "joining" : "menu");
  const [link, setLink] = useState("");
  const [view, setView] = useState<GameView | null>(null);
  const [notice, setNotice] = useState(HASH_ID ? "Ulanmoqda..." : "");
  const [failed, setFailed] = useState(false); // ulanishda xato chiqdi

  const linkRef = useRef<Link | null>(null);
  const stateRef = useRef<GameState | null>(null); // faqat host'da
  const roleRef = useRef<PlayerId | null>(null);
  const started = useRef(false);

  const publish = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    setView(toView(s, "host"));
    linkRef.current?.send({ type: "view", view: toView(s, "guest") });
  }, []);

  const startHost = useCallback(() => {
    roleRef.current = "host";
    setMode("hosting");
    setNotice("Havola tayyorlanmoqda...");
    linkRef.current = hostGame({
      onReady: (id) => {
        setLink(location.href.split("#")[0] + "#" + id);
        setNotice("Havolani do'stingizga yuboring");
      },
      onOpen: () => {
        // qayta ulanganda o'yin davom etadi, yangidan boshlanmaydi
        if (!stateRef.current) stateRef.current = createGame();
        setMode("playing");
        setNotice("");
        publish();
      },
      onMessage: (msg) => {
        const s = stateRef.current;
        if (!s) return;
        try {
          if (msg.type === "action") {
            const r = applyAction(s, "guest", msg.action);
            if (r.ok) {
              stateRef.current = r.state;
              publish();
            } else {
              linkRef.current?.send({ type: "error", text: r.error });
            }
          } else if (msg.type === "newgame" && s.phase === "finished") {
            stateRef.current = createGame();
            publish();
          }
        } catch {
          linkRef.current?.send({ type: "error", text: "Noto'g'ri yurish" });
        }
      },
      onClose: () => setNotice("Do'st uzildi"),
      onError: (text) => {
        setNotice(text);
        setFailed(true);
      },
    });
  }, [publish]);

  const connectGuest = useCallback((id: string) => {
    roleRef.current = "guest";
    linkRef.current = joinGame(id, {
      onOpen: () => {
        setMode("playing");
        setNotice("Ulandi. Kartalar tarqatilmoqda...");
      },
      onMessage: (msg) => {
        if (msg.type === "view") {
          setView(msg.view);
          setNotice("");
        } else if (msg.type === "error") {
          setNotice(msg.text);
        }
      },
      onClose: () => setNotice("Host uzildi"),
      onError: (text) => {
        setNotice(text);
        setFailed(true);
      },
    });
  }, []);

  // Havola orqali kirilgan bo'lsa, o'zi ulanadi (StrictMode ikki marta ishga tushirmasin)
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (HASH_ID) connectGuest(HASH_ID);
  }, [connectGuest]);

  const act = useCallback(
    (action: Action) => {
      if (roleRef.current === "host") {
        const s = stateRef.current;
        if (!s) return;
        const r = applyAction(s, "host", action);
        if (r.ok) {
          stateRef.current = r.state;
          setNotice("");
          publish();
        } else {
          setNotice(r.error);
        }
      } else {
        linkRef.current?.send({ type: "action", action });
      }
    },
    [publish],
  );

  const newGame = useCallback(() => {
    if (roleRef.current === "host") {
      if (stateRef.current?.phase !== "finished") return;
      stateRef.current = createGame();
      publish();
    } else {
      linkRef.current?.send({ type: "newgame" });
    }
  }, [publish]);

  return { mode, link, view, notice, failed, startHost, act, newGame };
}