import type { CSSProperties } from "react";

// Yelpig'ich: o'rtadan chetga qarab karta biroz buriladi va pastga tushadi.
// flip = true bo'lsa teskari (yuqoridagi raqib uchun).
export function fanStyle(i: number, n: number, flip = false): CSSProperties {
  const off = i - (n - 1) / 2;
  const rot = off * 3;
  const drop = off * off * 1.2;
  return {
    "--rot": `${flip ? -rot : rot}deg`,
    "--drop": `${flip ? -drop : drop}px`,
  } as CSSProperties;
}

// Kartalar ko'paygan sari bir-birining ustiga ko'proq chiqadi (ekranga sig'ishi uchun)
export function fanOverlap(n: number): CSSProperties {
  const lap = n <= 6 ? 0.2 : Math.min(0.8, 0.2 + (n - 6) * 0.06);
  return { "--lap": lap } as CSSProperties;
}
