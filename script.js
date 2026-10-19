/* ============================================================
   Calendario, resultados y clasificación: se cargan de data.json,
   que genera solo scripts/update-data.mjs (GitHub Action, ver README).
   La plantilla es manual: edita SQUAD cuando cambie.
   ============================================================ */
const ME = "CD Tarancón";
const SQUAD = [
  { n: 11, name: "Mădălin Fizeșan", pos: "DEL", role: "Delantero" },
  { n: 7, name: "Iván Cabellud", pos: "DEL", role: "Delantero" },
  { n: null, name: "Paulinho", pos: "DEL", role: "Delantero" },
  { n: 5, name: "Yves Clovis Ouedraogo", pos: "MED", role: "Centrocampista" },
  { n: 14, name: "Carlos Gascó", pos: "DEF", role: "Defensa" },
  { n: 21, name: "Kiko Pomares", pos: "DEF", role: "Defensa" },
  { n: null, name: "Víctor Armenteros", pos: "DEF", role: "Defensa" },
  { n: null, name: "José Muñoz", pos: "DEF", role: "Defensa" },
  { n: null, name: "Peter Mbia", pos: "POR", role: "Portero" },
  { n: null, name: "Pery", pos: "POR", role: "Portero" },
];

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, "0");
const cap = (s) => s.replace(/^./, (c) => c.toUpperCase());
const short = (n) => (n === ME ? "Tarancón" : n.replace(/^(UD|CD|CF|SD|AD|CP)\s+/, ""));
const initials = (n) => n.replace(/^(UD|CD|CF|SD|AD|CP)\s+/, "").split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();

/* Nav */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();
const menuBtn = $("#menu-btn");
const setMenu = (open) => {
  nav.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
};
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
$$(".nav-links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* Jugadores */
const roster = $("#roster");
roster.innerHTML = SQUAD.map((p) =>
  `<li class="player" data-pos="${p.pos}"><span class="p-num">${p.n == null ? "–" : pad(p.n)}</span><div><div class="p-name">${p.name}</div><div class="p-pos">${p.role}</div></div><span class="p-tag" data-pos="${p.pos}">${p.pos}</span></li>`
).join("");
$$(".filters button[data-f]").forEach((btn) => btn.addEventListener("click", () => {
  $$(".filters button[data-f]").forEach((b) => b.setAttribute("aria-selected", b === btn));
  const f = btn.dataset.f;
  $$(".player", roster).forEach((li) => li.classList.toggle("hide", f !== "all" && li.dataset.pos !== f));
}));

/* Formulario de socios (demostración, sin envío real) */
const form = $("#join"), msg = $("#join-msg");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = form.nombre, email = form.email;
  [nombre, email].forEach((i) => i.classList.remove("invalid"));
  msg.className = "form-msg";
  if (nombre.value.trim().length < 3) { nombre.classList.add("invalid"); msg.textContent = "Escribe tu nombre y apellidos."; msg.classList.add("err"); nombre.focus(); return; }
  if (!/^\S+@\S+\.\S+$/.test(email.value)) { email.classList.add("invalid"); msg.textContent = "Revisa el correo: parece incompleto."; msg.classList.add("err"); email.focus(); return; }
  msg.textContent = `¡Gracias, ${nombre.value.trim().split(" ")[0]}! Te contactaremos para completar tu alta.`;
  msg.classList.add("ok"); form.reset();
});

/* Aparición al hacer scroll */
$$(".section-head, .fixture, .cal-grid, .club-copy, .timeline, .members-grid > *, .roster").forEach((el) => el.classList.add("reveal"));
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12 });
$$(".reveal, .pathway").forEach((el) => io.observe(el));
$("#year").textContent = new Date().getFullYear();

/* ---------- Datos en vivo ---------- */
const fmtShort = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" });
const fmtLong = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const fmtStamp = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/* Hora de cada partido; España cambia de horario el 25-oct-2026, 28-mar-2027 y 31-oct-2027 */
const kickoff = (f) => {
  const summer = (f.d >= "2026-03-29" && f.d < "2026-10-25") || (f.d >= "2027-03-28" && f.d < "2027-10-31");
  return new Date(`${f.d}T${f.time || "12:00"}:00${summer ? "+02:00" : "+01:00"}`);
};
const played = (f) => Array.isArray(f.score);
const result = (f) => {
  const mine = f.home === ME ? 0 : 1;
  const gf = f.score[mine], gc = f.score[1 - mine];
  return gf > gc ? "V" : gf < gc ? "D" : "E";
};
const rival = (f) => (f.home === ME ? f.away : f.home);
const scoreTxt = (f) => `${f.score[0]} – ${f.score[1]}`;
const day = (f) => cap(fmtShort.format(kickoff(f)).replace(/\./g, ""));
const label = { V: "Victoria", E: "Empate", D: "Derrota" };

function render(data) {
  const fixtures = data.fixtures;
  const done = fixtures.filter(played);
  const upcoming = fixtures.filter((f) => !played(f));
  const next = upcoming[0];

  /* Barra de partidos en el hero */
  const last = done[done.length - 1];
  $("#mb-last").innerHTML = last
    ? `<small>Último resultado</small><span><b>${short(last.home)}</b> ${scoreTxt(last)} <b>${short(last.away)}</b></span>` : "";
  $("#mb-next").innerHTML = next
    ? `<small>Próximo partido</small><span><b>${short(next.home)}</b> vs <b>${short(next.away)}</b> · ${day(next)}${next.time ? ` · ${next.time} h` : ""}</span>` : "";

  /* Próximo partido */
  if (next) {
    const target = kickoff(next);
    const away = next.home !== ME;
    $("#fx-comp").textContent = next.comp || `Tercera Federación · Jornada ${next.j}`;
    $("#fx-rival").textContent = rival(next);
    $("#fx-crest").textContent = initials(rival(next));
    $("#fx-venue").textContent = away ? `Campo de ${short(next.home)}` : data.venue;
    $(".fixture-teams").style.flexDirection = away ? "row-reverse" : "";
    const dEl = $("#fx-date");
    dEl.dateTime = target.toISOString();
    dEl.textContent = next.time ? cap(fmtLong.format(target)) + " h" : cap(fmtShort.format(target).replace(/\./g, "")) + " · hora por confirmar";

    const after = upcoming[1], t = $("#then");
    t.hidden = !after;
    if (after) t.innerHTML = `Después: <b>${after.comp ? after.comp + " · " : ""}${rival(after)}</b>, ${day(after).toLowerCase()}${after.time ? ` · ${after.time} h` : ""}.`;

    const units = Object.fromEntries($$("[data-u]").map((el) => [el.dataset.u, el]));
    const tick = () => {
      let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const mi = Math.floor(s / 60); s -= mi * 60;
      units.d.textContent = pad(d); units.h.textContent = pad(h); units.m.textContent = pad(mi); units.s.textContent = pad(s);
    };
    tick(); clearInterval(render.timer); render.timer = setInterval(tick, 1000);
  }
  $("#partido").hidden = !next;

  /* Clasificación oficial */
  /* Por defecto solo el Tarancón y los 2 de arriba y los 2 de abajo */
  const mineIdx = Math.max(0, data.table.findIndex((r) => r.team === ME));
  const from = Math.min(Math.max(0, mineIdx - 2), Math.max(0, data.table.length - 5));
  let fullTable = false;
  const stBtn = $("#st-more");
  const renderTable = () => {
    const rows = fullTable ? data.table : data.table.slice(from, from + 5);
    $("#st-body").innerHTML = rows.map((r) =>
      `<tr${r.team === ME ? ' class="me"' : ""}><td>${r.pos}</td><th scope="row">${r.team}</th><td>${r.pj}</td><td>${r.gf - r.gc > 0 ? "+" : ""}${r.gf - r.gc}</td><td><b>${r.pts}</b></td></tr>`
    ).join("");
    stBtn.textContent = fullTable ? "Ver solo mi zona" : "Ver tabla completa";
  };
  stBtn.onclick = () => { fullTable = !fullTable; renderTable(); };
  renderTable();
  const mine = data.table.find((r) => r.team === ME);
  $("#st-form").innerHTML = mine ? mine.form.map((r) => `<span class="res-badge res-${r}" title="${label[r]}">${r}</span>`).join("") : "";
  $("#st-link").href = data.standingsUrl;

  /* Calendario */
  const list = $("#fixtures"), more = $("#cal-more");
  let calView = "next", expanded = false;
  const row = (f, isNext) => {
    const isPlayed = played(f), r = isPlayed ? result(f) : "";
    const badge = isPlayed ? `<span class="res-badge res-${r}" title="${label[r]}">${r}</span>` : `<span class="res-badge res-next" title="Por jugar"></span>`;
    const mid = isPlayed ? `<b class="fx-score">${scoreTxt(f)}</b>` : `<span class="fx-time">${f.time || "—"}</span>`;
    const team = (n) => `<span class="fx-team${n === ME ? " me" : ""}">${n}</span>`;
    const tag = f.comp ? `<span class="fx-tag">Copa</span>` : `J${f.j}`;
    return `<li class="fx${isNext ? " next" : ""}">${badge}<span class="fx-day"><span>${tag}</span> ${day(f)}</span><span class="fx-match">${team(f.home)}${mid}${team(f.away)}</span></li>`;
  };
  const renderCal = () => {
    const src = calView === "next" ? upcoming : [...done].reverse();
    list.innerHTML = (expanded ? src : src.slice(0, 6)).map((f, i) => row(f, calView === "next" && i === 0)).join("");
    more.hidden = src.length <= 6;
    more.textContent = expanded ? "Ver menos" : calView === "next" ? `Ver las ${src.length} citas restantes` : `Ver los ${src.length} resultados`;
  };
  $$("[data-cal]").forEach((b) => { b.onclick = () => {
    calView = b.dataset.cal; expanded = false;
    $$("[data-cal]").forEach((x) => x.setAttribute("aria-selected", x === b));
    renderCal();
  }; });
  more.onclick = () => { expanded = !expanded; renderCal(); };
  renderCal();

  $("#updated").textContent = data.updated ? ` Datos actualizados el ${fmtStamp.format(new Date(data.updated))}.` : "";
}

fetch("data.json", { cache: "no-cache" })
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(render)
  .catch(() => {
    $("#fixtures").innerHTML = `<li class="fx-empty">No se han podido cargar los partidos. Vuelve a intentarlo en unos minutos.</li>`;
    $("#cal-more").hidden = true;
    $("#partido").hidden = true;
    $("#mb-last").hidden = $("#mb-next").hidden = true;
  });
