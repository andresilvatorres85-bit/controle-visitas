import { MESES } from "./constants.js";

export function protocolo(y, seq) {
  return `${String(seq).padStart(4, "0")}/${y}`;
}

export function todayParts() {
  const d = new Date();
  return { d: d.getDate(), m: d.getMonth() + 1, y: d.getFullYear() };
}

export function fmtData(rec) {
  if (!rec.d) return `${MESES[rec.m]}/${rec.y}`;
  return `${String(rec.d).padStart(2, "0")}/${String(rec.m).padStart(2, "0")}/${rec.y}`;
}

export function chaveOrdenacao(rec) {
  return rec.y * 10000 + rec.m * 100 + (rec.d || 0);
}
