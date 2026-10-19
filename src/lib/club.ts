// Datos del club y utilidades de partidos. data.json lo genera scripts/update-data.mjs.
import data from "../data/data.json";
import squad from "../data/squad.json";

export const ME = "CD Tarancón";

export interface Fixture {
  d: string;            // fecha local, YYYY-MM-DD
  time?: string;        // hora local hh:mm (si se conoce)
  home: string;
  away: string;
  j?: number;           // jornada de liga
  comp?: string;        // competición, si no es liga
  score?: [number, number];
}
export interface TableRow {
  pos: number; team: string; pts: number; pj: number;
  g: number; e: number; p: number; gf: number; gc: number; form: ("V" | "E" | "D")[];
}
export interface Player { n: number | null; name: string; pos: "POR" | "DEF" | "MED" | "DEL"; role: string }

export const venue: string = data.venue;
export const standingsUrl: string = data.standingsUrl;
export const updated: string = data.updated;
export const fixtures = data.fixtures as Fixture[];
export const table = data.table as TableRow[];
export const players = squad as Player[];

export const played = (f: Fixture) => Array.isArray(f.score);
export const done = fixtures.filter(played);
export const upcoming = fixtures.filter((f) => !played(f));
export const next = upcoming[0];
export const last = done[done.length - 1];

/** España cambia de horario el 25-oct-2026, 28-mar-2027 y 31-oct-2027. */
export function kickoff(f: Fixture): Date {
  const summer = (f.d >= "2026-03-29" && f.d < "2026-10-25") || (f.d >= "2027-03-28" && f.d < "2027-10-31");
  return new Date(`${f.d}T${f.time || "12:00"}:00${summer ? "+02:00" : "+01:00"}`);
}

export function result(f: Fixture): "V" | "E" | "D" {
  const mine = f.home === ME ? 0 : 1;
  const gf = f.score![mine], gc = f.score![1 - mine];
  return gf > gc ? "V" : gf < gc ? "D" : "E";
}
export const rival = (f: Fixture) => (f.home === ME ? f.away : f.home);
export const scoreTxt = (f: Fixture) => `${f.score![0]} – ${f.score![1]}`;
export const short = (n: string) => (n === ME ? "Tarancón" : n.replace(/^(UD|CD|CF|SD|AD|CP)\s+/, ""));
export const initials = (n: string) =>
  n.replace(/^(UD|CD|CF|SD|AD|CP)\s+/, "").split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();

const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
const tz = { timeZone: "Europe/Madrid" } as const;
const fmtShort = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", ...tz });
const fmtLong = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", ...tz });
const fmtStamp = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", ...tz });
export const day = (f: Fixture) => cap(fmtShort.format(kickoff(f)).replace(/\./g, ""));
export const dayLong = (f: Fixture) => cap(fmtLong.format(kickoff(f)));
export const stamp = (iso: string) => fmtStamp.format(new Date(iso));
export const resultLabel = { V: "Victoria", E: "Empate", D: "Derrota" } as const;

/** Clasificación: el Tarancón, los 2 de arriba y los 2 de abajo. */
export const myIndex = Math.max(0, table.findIndex((r) => r.team === ME));
export const nearby = (() => {
  const from = Math.min(Math.max(0, myIndex - 2), Math.max(0, table.length - 5));
  return table.slice(from, from + 5);
})();
export const myRow = table.find((r) => r.team === ME);
