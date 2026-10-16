"use strict";

/* ---------- Datos ----------
   Jerarquía (de afuera hacia adentro):
   Biocéntrico ⊃ Límites Ecológicos ⊃ [ Ecocéntrico ⊃ Hidrocéntrico ] → Regenerativo → Comercio Ecológico ⇄ Circularidad
   Geometría en unidades de R (radio de referencia), centro (0,0). */

const NODES = [
  { id: "bio", name: "Biocéntrico", rgb: [196, 163, 105], ring: 0.98, ang: -2.2, spin: -0.03,
    desc: "El círculo que lo contiene todo: asegura la preservación y la salud de todas las formas de vida en Kennedy." },
  { id: "lim", name: "Límites Ecológicos", rgb: [170, 164, 146], ring: 0.88, ang: 0.9, spin: 0.036,
    desc: "Contiene toda la dinámica: ajusta los flujos de mercancías, el transporte de carga y la movilidad humana." },
  { id: "eco", name: "Ecocéntrico", rgb: [88, 168, 156], x: -0.42, y: -0.2, r: 0.18, lab: null,
    desc: "Punto de partida: abarca al Hidrocéntrico y reconoce que el agua y la red hídrica ordenan el territorio." },
  { id: "hidro", name: "Hidrocéntrico", rgb: [96, 152, 184], x: -0.18, y: 0.06, r: 0.15, lab: -50,
    desc: "El agua y la red hídrica son la estructura viva que ordena el territorio." },
  { id: "regen", name: "Regenerativo", rgb: [185, 125, 98], x: 0.08, y: 0.45, r: 0.13, lab: 5,
    desc: "Recupera el suelo pavimentado para que el agua se filtre y la vida urbana florezca." },
  { id: "com", name: "Comercio Ecológico", rgb: [150, 176, 125], x: 0.45, y: 0.12, r: 0.17, lab: 90,
    desc: "Reestructura el comercio mayorista, las plazas de mercado y las ventas informales para que funcionen como redes de abastecimiento limpio y no como focos de sobreexplotación." },
  { id: "circ", name: "Circularidad", rgb: [214, 196, 140], x: 0.3, y: -0.42, r: 0.13, lab: 60,
    desc: "Transforma el volumen masivo de residuos orgánicos en nuevos insumos para la comunidad y el suelo." }
];
const byId = {};
NODES.forEach((n, i) => { byId[n.id] = n; n.phase = i * 1.9; n.pulse = 0; });

// Círculo del Ecocéntrico (abarca al Hidrocéntrico)
const ECO = { x: -0.32, y: -0.08, r: 0.46 };

// Elementos de cada macromodelo: [nombre, ángulo en grados (0° = derecha, 90° = abajo)]
const SATS = {
  hidro: [["Humedal El Burro", 150], ["Red hídrica", 100], ["Cuerpos de agua", 40]],
  regen: [["Suelo pavimentado", 200], ["Infiltración del agua", 120], ["Vida urbana", 70]],
  com: [["Comercio mayorista", -80], ["Plazas de mercado", -35], ["Ventas informales", 10]],
  circ: [["Residuos orgánicos", -120], ["Nuevos insumos", -50]]
};
const SATELLITES = [];
Object.keys(SATS).forEach(pid => {
  SATS[pid].forEach(([name, deg], i) => SATELLITES.push({ parent: byId[pid], name, base: deg * Math.PI / 180, ph: i * 2.3 + byId[pid].phase }));
});

// Vínculos (llevan gotas en ambos sentidos)
const EDGES = [["eco", "hidro"], ["hidro", "regen"], ["regen", "com"], ["com", "circ"],
               ["circ", "regen"], ["com", "lim"], ["com", "bio"], ["lim", "bio"]]
  .map(([a, b]) => ({ a: byId[a], b: byId[b], drops: [{ t: Math.random(), dir: 1 }, { t: Math.random(), dir: -1 }] }));

const RELS = {
  bio: [["contiene", "lim", "Toda la dinámica del territorio ocurre dentro de ella, bajo el fin de preservar la vida."],
        ["equilibrio con", "com", "La intensidad del comercio y la economía popular coexiste en equilibrio bajo este macromodelo."]],
  lim: [["contenido en", "bio", "Su fin último es asegurar la preservación y la salud de todas las formas de vida en Kennedy."],
        ["contiene", "eco", "Todo el sistema ecocéntrico opera dentro de estos límites."],
        ["ajusta", "com", "Ajusta los flujos de mercancías, el transporte de carga y la movilidad humana."]],
  eco: [["abarca", "hidro", "Reconoce que el agua y la red hídrica son la estructura viva que ordena el territorio."],
        ["contenido en", "lim", "La dinámica ecocéntrica se ajusta a los límites ecológicos."]],
  hidro: [["contenido en", "eco", "Es parte del Ecocéntrico: la estructura viva que ordena el territorio."],
          ["se articula con", "regen", "Para permitir que el agua se filtre y la vida urbana florezca, se articula con la regeneración del suelo."]],
  regen: [["se articula con", "hidro", "Recupera el suelo pavimentado para que el agua de la red hídrica pueda filtrarse."],
          ["se enlaza con", "com", "La recuperación del suelo se enlaza con la reestructuración del comercio."],
          ["recibe de", "circ", "Los nuevos insumos de la circularidad alimentan el suelo."]],
  com: [["se enlaza con", "regen", "Funciona como red de abastecimiento limpio sobre un territorio que se regenera."],
        ["se sostiene en", "circ", "Su actividad se sostiene sobre la transformación de los residuos orgánicos en insumos."],
        ["ajustado por", "lim", "Los flujos de mercancías, el transporte de carga y la movilidad humana quedan dentro de los límites ecológicos."],
        ["equilibrio con", "bio", "La intensidad del comercio y la economía popular coexiste en equilibrio con la vida."]],
  circ: [["sostiene a", "com", "Sobre el reaprovechamiento de residuos se apoya la actividad comercial."],
         ["alimenta a", "regen", "Los nuevos insumos van a la comunidad y al suelo."]]
};

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

/* ---------- Canvas ---------- */

const cv = document.getElementById("net");
const ctx = cv.getContext("2d");
let W = 0, H = 0, dpr = 1;
let selected = null, hover = null;
const L = { cx: 0, cy: 0, R: 100, init: false };

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const dust = Array.from({ length: 45 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.4, 1), s: rand(0.003, 0.01), p: Math.random() * 6 }));

function targetLayout() {
  const wide = W >= 800;
  const top = wide ? 118 : 104;
  const bottom = selected && !wide ? H * 0.46 : 30;
  const left = selected && wide ? 392 : 0;
  const aw = W - left, ah = H - top - bottom;
  return { cx: left + aw / 2, cy: top + ah / 2, R: Math.max(70, Math.min(aw, ah) / 2 - 18) };
}

function pos(n, t) {
  if (n.ring) {
    const a = n.ang + n.spin * t;
    return { x: L.cx + Math.cos(a) * n.ring * L.R, y: L.cy + Math.sin(a) * n.ring * L.R, r: 0 };
  }
  const dx = Math.sin(t * 0.45 + n.phase) * 0.01, dy = Math.cos(t * 0.38 + n.phase * 1.3) * 0.01;
  return { x: L.cx + (n.x + dx) * L.R, y: L.cy + (n.y + dy) * L.R, r: n.r * L.R * (1 + 0.015 * Math.sin(t * 0.8 + n.phase)) };
}
function satPos(s, t) {
  const p = pos(s.parent, t), a = s.base + 0.18 * Math.sin(t * 0.4 + s.ph);
  const d = p.r + 0.08 * L.R;
  return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 0.034 * L.R };
}

const act = () => selected || hover;
const related = id => {
  const a = act();
  if (!a || a === id) return true;
  return (RELS[a] || []).some(r => r[1] === id) || (RELS[id] || []).some(r => r[1] === a);
};

function pillSize(n, fs) {
  ctx.font = `600 ${fs}px system-ui, sans-serif`;
  n.pw = ctx.measureText(n.name).width + 20; n.ph = fs + 12;
}

function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.05, (nowMs - (frame.last || nowMs)) / 1000);
  frame.last = nowMs;

  const tl = targetLayout();
  if (!L.init) Object.assign(L, tl, { init: true });
  const k = 1 - Math.exp(-dt * 6);
  L.cx += (tl.cx - L.cx) * k; L.cy += (tl.cy - L.cy) * k; L.R += (tl.R - L.R) * k;
  NODES.forEach(n => { n.pulse = Math.max(0, n.pulse - dt * 1.4); });

  const fs = Math.max(10, Math.min(14, L.R * 0.05));
  const P = {}; NODES.forEach(n => { P[n.id] = pos(n, now); });
  pillSize(byId.lim, fs); pillSize(byId.bio, fs);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  dust.forEach(d => {
    d.y -= d.s * dt; if (d.y < 0) d.y = 1;
    ctx.fillStyle = `rgba(190,200,190,${0.07 + 0.05 * Math.sin(now + d.p)})`;
    ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, TAU); ctx.fill();
  });

  // círculos contenedores: Biocéntrico ⊃ Límites ⊃ Ecocéntrico
  const circle = (id, x, y, r) => {
    const n = byId[id], al = related(id) ? 1 : 0.3, sel = selected === id || hover === id;
    ctx.strokeStyle = rgba(n.rgb, 0.78 * al + (sel ? 0.2 : 0));
    ctx.lineWidth = sel ? 3 : 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  };
  circle("bio", L.cx, L.cy, 0.98 * L.R);
  circle("lim", L.cx, L.cy, 0.88 * L.R);
  circle("eco", L.cx + ECO.x * L.R, L.cy + ECO.y * L.R, ECO.r * L.R * (1 + 0.01 * Math.sin(now * 0.7)));

  // vínculos con gotas
  EDGES.forEach(e => {
    const a = P[e.a.id], b = P[e.b.id];
    const on = !act() || e.a.id === act() || e.b.id === act();
    ctx.strokeStyle = `rgba(200,205,195,${on ? 0.24 : 0.06})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    e.drops.forEach(d => {
      d.t += 0.1 * dt * 260 / Math.max(len, 160);
      if (d.t >= 1) { d.t -= 1; (d.dir > 0 ? e.b : e.a).pulse = 1; }
      const col = (d.dir > 0 ? e.a : e.b).rgb;
      const f = t => { const u = d.dir > 0 ? t : 1 - t; return [a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u]; };
      for (let i = 7; i >= 0; i--) {
        const tt = d.t - i * 0.012 * 160 / Math.max(len, 160);
        if (tt < 0) continue;
        const q = 1 - i / 7, p = f(tt);
        ctx.fillStyle = rgba(col, 0.5 * q * (on ? 1 : 0.25));
        ctx.beginPath(); ctx.arc(p[0], p[1], 0.7 + 1.8 * q, 0, TAU); ctx.fill();
      }
      const h = f(d.t);
      ctx.fillStyle = `rgba(245,240,225,${on ? 0.9 : 0.25})`;
      ctx.beginPath(); ctx.arc(h[0], h[1], 1.9, 0, TAU); ctx.fill();
    });
  });

  // satélites
  SATELLITES.forEach(s => {
    const p = P[s.parent.id], q = satPos(s, now);
    const al = related(s.parent.id) ? 1 : 0.25;
    ctx.strokeStyle = rgba(s.parent.rgb, 0.45 * al); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(s.parent.rgb, 0.85 * al); ctx.lineWidth = 1.4; ctx.stroke();
    if (act() === s.parent.id) {
      ctx.font = `500 ${Math.max(9.5, fs - 3)}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.strokeText(s.name, q.x, q.y + q.r + 3);
      ctx.fillStyle = `rgba(200,205,195,${0.9 * al})`; ctx.fillText(s.name, q.x, q.y + q.r + 3);
    }
  });

  // burbujas principales (sólidas)
  NODES.filter(n => !n.ring).forEach(n => {
    const p = P[n.id], al = related(n.id) ? 1 : 0.3, sel = selected === n.id || hover === n.id;
    const m = n.pulse * 0.3, bg = 0.82 * al;
    ctx.fillStyle = `rgb(${n.rgb.map(c => Math.round((c + (255 - c) * m) * bg)).join(",")})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + 0.06 * n.pulse), 0, TAU); ctx.fill();
    if (sel) { ctx.strokeStyle = "rgba(245,240,225,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 4, 0, TAU); ctx.stroke(); }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    let tx = p.x, ty = p.y, col = `rgba(8,12,12,${al})`;
    if (n.lab !== null) {
      const a = n.lab * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
      tx += cs * (p.r + 6); ty += sn * (p.r + fs * 0.75); col = `rgba(235,230,215,${al})`;
      ctx.textAlign = cs > 0.35 ? "left" : cs < -0.35 ? "right" : "center";
      ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#000"; ctx.strokeText(n.name, tx, ty);
    }
    ctx.fillStyle = col; ctx.fillText(n.name, tx, ty);
  });

  // fichas sobre los anillos
  ["bio", "lim"].forEach(id => {
    const n = byId[id], p = P[id], al = related(id) ? 1 : 0.35, sel = selected === id || hover === id;
    const w = n.pw, h = n.ph, x = p.x - w / 2, y = p.y - h / 2;
    ctx.fillStyle = rgba(n.rgb, al);
    ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    if (sel) { ctx.strokeStyle = "rgba(245,240,225,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - 3, y - 3, w + 6, h + 6, (h + 6) / 2); ctx.stroke(); }
    ctx.font = `600 ${fs}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(8,12,12,${al})`; ctx.fillText(n.name, p.x, p.y + 0.5);
  });

  requestAnimationFrame(frame);
}

/* ---------- Interacción ---------- */

function pick(x, y) {
  const t = performance.now() / 1000;
  for (const id of ["bio", "lim"]) {
    const n = byId[id], p = pos(n, t);
    if (n.pw && Math.abs(x - p.x) < n.pw / 2 + 4 && Math.abs(y - p.y) < n.ph / 2 + 4) return id;
  }
  for (const id of ["circ", "com", "regen", "hidro", "eco"]) {
    const p = pos(byId[id], t);
    if (Math.hypot(x - p.x, y - p.y) < p.r + 6) return id;
  }
  if (Math.hypot(x - (L.cx + ECO.x * L.R), y - (L.cy + ECO.y * L.R)) < ECO.r * L.R) return "eco";
  const d = Math.hypot(x - L.cx, y - L.cy) / L.R;
  if (d < 0.93) return "lim";
  if (d < 1.08) return "bio";
  return null;
}

cv.addEventListener("pointermove", ev => {
  hover = pick(ev.clientX, ev.clientY);
  cv.style.cursor = hover ? "pointer" : "default";
});
cv.addEventListener("pointerleave", () => { hover = null; });
cv.addEventListener("pointerdown", ev => {
  document.getElementById("hint").classList.add("off");
  const id = pick(ev.clientX, ev.clientY);
  if (id) { hover = id; select(selected === id ? null : id); }
  else if (selected) select(null);
});

/* ---------- Panel y chips ---------- */

const panel = document.getElementById("panel");
const chips = document.getElementById("chips");

["bio", "lim", "eco", "hidro", "regen", "com", "circ"].forEach(id => {
  const n = byId[id];
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.dataset.id = id;
  b.style.setProperty("--c", rgba(n.rgb, 1));
  b.setAttribute("aria-pressed", "false");
  b.innerHTML = `<i></i>${n.name}`;
  b.addEventListener("click", () => select(selected === id ? null : id));
  chips.appendChild(b);
});

function select(id) {
  selected = id;
  chips.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  if (!id) { panel.hidden = true; return; }
  const n = byId[id];
  panel.style.setProperty("--c", rgba(n.rgb, 1));
  document.getElementById("p-title").innerHTML = `<i></i>${n.name}`;
  document.getElementById("p-desc").textContent = n.desc;
  document.getElementById("p-links").innerHTML = RELS[id].map(r =>
    `<li style="--c:${rgba(byId[r[1]].rgb, 1)}"><b><span class="dir">${r[0]}</span>${byId[r[1]].name}</b>${r[2]}</li>`).join("");
  panel.scrollTop = 0;
  panel.hidden = false;
}
document.getElementById("close").addEventListener("click", () => select(null));
window.addEventListener("keydown", e => { if (e.key === "Escape") select(null); });

requestAnimationFrame(frame);
