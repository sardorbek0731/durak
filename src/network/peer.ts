import Peer, { type DataConnection } from "peerjs";
import type { Message } from "../types";

const PEER_OPTS = {
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  },
};

export interface Link {
  send(msg: Message): void;
  close(): void;
}

interface Handlers {
  onOpen(): void;
  onMessage(msg: Message): void;
  onClose(): void;
  onError(text: string): void;
}

function errorText(type: string): string {
  return type === "peer-unavailable"
    ? "Havola eskirgan. Do'stingizdan yangi havola so'rang"
    : `Ulanishda xato (${type}). Sahifani yangilab qayta urinib ko'ring`;
}

function wire(c: DataConnection, h: Handlers) {
  if (c.open) h.onOpen();
  else c.on("open", h.onOpen);
  c.on("data", (d) => h.onMessage(d as Message));
  c.on("close", h.onClose);
}

// Host: havola yaratadi va do'stni kutadi
export function hostGame(h: Handlers & { onReady(id: string): void }): Link {
  const peer = new Peer(PEER_OPTS);
  let conn: DataConnection | null = null;
  let announced = false;

  peer.on("open", (id) => {
    // reconnect() dan keyin "open" yana chiqadi: havolani qayta e'lon qilmaymiz
    if (announced) return;
    announced = true;
    h.onReady(id);
  });

  // signal serveri bilan aloqa uzilsa (masalan, ekran o'chsa), 2 soniyadan keyin qayta ulanamiz
  peer.on("disconnected", () => {
    setTimeout(() => {
      if (peer.disconnected && !peer.destroyed) peer.reconnect();
    }, 2000);
  });

  peer.on("connection", (c) => {
    // yangi ulanish eskisining o'rnini oladi (do'st sahifani yangilagan bo'lishi mumkin)
    const old = conn;
    conn = c;
    old?.close();
    wire(c, {
      ...h,
      onClose: () => {
        if (conn === c) h.onClose();
      },
    });
  });

  peer.on("error", (e) => {
    // o'yin ketayotganda signal serveri xatolari o'yinni buzmaydi
    if (conn?.open) return;
    h.onError(errorText(e.type));
  });

  return {
    send: (msg) => {
      if (conn && conn.open) conn.send(msg);
    },
    close: () => peer.destroy(),
  };
}

// Guest: havoladagi id bo'yicha hostga ulanadi
export function joinGame(id: string, h: Handlers): Link {
  const peer = new Peer(PEER_OPTS);
  let conn: DataConnection | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  peer.on("open", () => {
    if (conn) return; // ikkinchi ulanish ochmaymiz
    const c = peer.connect(id, { reliable: true });
    conn = c;
    timer = setTimeout(() => {
      if (!c.open)
        h.onError(
          "Ulanib bo'lmadi. Tarmoq to'sqinlik qilmoqda yoki havola eskirgan",
        );
    }, 20000);
    c.on("open", () => clearTimeout(timer));
    wire(c, h);
  });

  peer.on("error", (e) => {
    if (conn?.open) return; // ulanish o'rnatilgan bo'lsa, signal xatolari muhim emas
    clearTimeout(timer);
    h.onError(errorText(e.type));
  });

  return {
    send: (msg) => {
      if (conn && conn.open) conn.send(msg);
    },
    close: () => peer.destroy(),
  };
}
