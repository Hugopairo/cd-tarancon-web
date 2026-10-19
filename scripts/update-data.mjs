// Genera data.json con el calendario, los resultados y la clasificación del CD Tarancón.
// Fuente: BeSoccer. Sin dependencias; requiere Node 18+.
// Si algo no cuadra (HTML cambiado, bloqueo, datos vacíos) termina con error y NO toca data.json,
// de modo que la web sigue mostrando los últimos datos buenos.
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import https from "node:https";

const ME = "CD Tarancón";
const SEASON_START = "2026-08-01"; // ignora amistosos y la temporada anterior
const URLS = {
  matches: "https://www.besoccer.com/team/matches/tarancon",
  table: "https://www.besoccer.com/team/table/tarancon",
};
const OUT = fileURLToPath(new URL("../data.json", import.meta.url));

// Se usa node:https y no fetch: BeSoccer responde 406 a las cabeceras sec-fetch-* que añade fetch.
const get = (url) => new Promise((resolve, reject) => {
  https.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.5",
    },
  }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      return get(new URL(res.headers.location, url).href).then(resolve, reject);
    }
    if (res.statusCode !== 200) { res.resume(); return reject(new Error(`${url} → HTTP ${res.statusCode}`)); }
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  }).on("error", reject).setTimeout(30000, function () { this.destroy(new Error(`timeout ${url}`)); });
});

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const text = (s) => decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

export function parseMatches(html) {
  const out = [];
  const re = /<a id="match-\d+"[^>]*class=" match-link"[^>]*starttime="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(re)) {
    const [, start, body] = m;
    const d = start.slice(0, 10);
    if (d < SEASON_START) continue;
    const middle = text((body.match(/class="middle-info[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "");
    const isLeague = /Tercera/i.test(middle);
    const isCup = /Copa/i.test(middle);
    if (!isLeague && !isCup) continue;
    const names = [...body.matchAll(/<div class="name">([\s\S]*?)<\/div>/g)].map((x) => text(x[1]));
    if (names.length < 2) continue;
    const f = { d, home: names[0], away: names[1] };
    const round = middle.match(/Round\s+(\d+)/i);
    if (isLeague && round) f.j = Number(round[1]);
    else if (isCup) f.comp = "Copa del Rey" + (middle.replace(/^.*?Copa del Rey\.?\s*/i, "").trim() ? " · " + middle.replace(/^.*?Copa del Rey\.?\s*/i, "").trim() : "");
    else continue;
    const hm = start.slice(11, 16);
    if (hm && hm !== "00:00") f.time = hm;
    const r1 = body.match(/class=['"]r1['"]>(\d+)</), r2 = body.match(/class=['"]r2['"]>(\d+)</);
    if (r1 && r2) f.score = [Number(r1[1]), Number(r2[1])];
    out.push(f);
  }
  const seen = new Set();
  return out
    .filter((f) => { const k = `${f.d}|${f.home}|${f.away}`; return seen.has(k) ? false : seen.add(k); })
    .sort((a, b) => (a.d + (a.time || "")).localeCompare(b.d + (b.time || "")));
}

export function parseTable(html) {
  const start = html.indexOf('<table class="table">');
  if (start < 0) return [];
  const end = html.indexOf("</table>", start);
  const tbl = html.slice(start, end);
  const rows = [];
  for (const tr of tbl.split('<tr class="row-body').slice(1)) {
    const pos = Number((tr.match(/data-cy="teamColor"[^>]*>\s*(\d+)\s*</) || [])[1]);
    const team = text((tr.match(/class="team-name">([\s\S]*?)<\/span>/) || [])[1] || "");
    const form = [...tr.matchAll(/bg-match-res (win|draw|lose)/g)].map((x) => ({ win: "V", draw: "E", lose: "D" }[x[1]]));
    const nums = [...tr.slice(tr.indexOf('class="name"')).matchAll(/<td[^>]*>\s*([+-]?\d+)\s*(?:<br>)?\s*<\/td>/g)].map((x) => Number(x[1]));
    if (!pos || !team || nums.length < 7) continue;
    const [pts, pj, g, e, p, gf, gc] = nums;
    rows.push({ pos, team, pts, pj, g, e, p, gf, gc, form });
  }
  return rows;
}

async function main() {
  const [mHtml, tHtml] = await Promise.all([get(URLS.matches), get(URLS.table)]);
  const fixtures = parseMatches(mHtml);
  const table = parseTable(tHtml);

  const leagueRounds = new Set(fixtures.filter((f) => f.j).map((f) => f.j));
  if (leagueRounds.size < 30) throw new Error(`Solo ${leagueRounds.size} jornadas de liga: la página ha cambiado o hay un bloqueo.`);
  if (table.length < 10 || !table.some((r) => r.team === ME)) throw new Error(`Clasificación incompleta (${table.length} filas).`);

  const data = {
    updated: new Date().toISOString(),
    venue: "Estadio Municipal de Tarancón",
    standingsUrl: URLS.table,
    fixtures,
    table,
  };

  // Solo reescribe si hay cambios reales (evita commits vacíos cada hora).
  let prev = null;
  try { prev = JSON.parse(await readFile(OUT, "utf8")); } catch {}
  const same = prev && JSON.stringify({ ...prev, updated: 0 }) === JSON.stringify({ ...data, updated: 0 });
  if (same) { console.log("Sin cambios."); return; }
  await writeFile(OUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`data.json actualizado: ${fixtures.length} partidos, ${table.length} equipos.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
}
