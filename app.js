"use strict";

/* ---------- Datos ----------
   Geometría en unidades de R (radio del círculo exterior ≈ 1), centro (0,0). */

const NODES = [
  { id: "lim", name: "Límites Ecológicos", rgb: [170, 164, 146], ring: 1.0, ang: -2.35, spin: 0.028,
    desc: "Contiene toda la estructura: fija la capacidad de carga del entorno." },
  { id: "bio", name: "Biocéntrico", rgb: [196, 163, 105], ring: 0.9, ang: 0.85, spin: -0.036,
    desc: "Asegura la preservación y el equilibrio de todas las formas de vida en el territorio." },
  { id: "eco", name: "Ecocéntrico", rgb: [88, 168, 156], x: 0, y: 0, r: 0.2,
    desc: "Punto de partida: la naturaleza como eje ordenador. Abarca a los demás macromodelos del territorio." },
  { id: "hidro", name: "Hidrocéntrico", rgb: [96, 152, 184], x: -0.34, y: -0.22, r: 0.15,
    desc: "El agua y la red hidrográfica son la estructura líquida que ordena todo el territorio." },
  { id: "biocl", name: "Bioclimático", rgb: [150, 176, 125], x: 0.22, y: -0.33, r: 0.13,
    desc: "La vegetación y los suelos permeables absorben las lluvias y regulan la temperatura de las islas de calor." },
  { id: "regen", name: "Regenerativo", rgb: [185, 125, 98], x: -0.22, y: 0.33, r: 0.14,
    desc: "Busca sanar el suelo pavimentado y devolverle su capacidad de vida." },
  { id: "circ", name: "Circularidad", rgb: [214, 196, 140], x: 0.28, y: 0.26, r: 0.13,
    desc: "Procesa los desechos del sector para reintegrarlos como nuevos insumos." }
];
const byId = {};
NODES.forEach((n, i) => { byId[n.id] = n; n.phase = i * 1.9; n.pulse = 0; });

// Elementos que componen cada macromodelo (burbujas satélite)
const SATS = {
  hidro: ["Humedal El Burro", "Red hidrográfica", "Cuerpos de agua"],
  biocl: ["Vegetación", "Suelos permeables", "Islas de calor"],
  regen: ["Suelo pavimentado", "Recuperación"],
  circ: ["Desechos", "Nuevos insumos"]
};
const SAT_OFFSETS = [1.22, -1.22, 2.1];
const SATELLITES = [];
Object.keys(SATS).forEach(pid => {
  const p = byId[pid], out = Math.atan2(p.y, p.x);
  SATS[pid].forEach((name, i) => SATELLITES.push({ parent: p, name, base: out + SAT_OFFSETS[i], ph: i * 2.3 + p.phase }));
});

// Conexiones entre macromodelos (cada una lleva gotas en los dos sentidos)
const EDGES = [["eco", "hidro"], ["eco", "regen"], ["eco", "bio"], ["hidro", "biocl"],
               ["biocl", "regen"], ["regen", "circ"], ["circ", "lim"], ["lim", "bio"]]
  .map(([a, b]) => ({ a: byId[a], b: byId[b], drops: [{ t: Math.random(), dir: 1 }, { t: Math.random(), dir: -1 }] }));

const RELS = {
  lim: [["contiene", "bio", "Toda la estructura está contenida dentro de los límites ecológicos: ninguna actividad puede superar la capacidad de carga del entorno."],
        ["contiene", "eco", "El Ecocéntrico y todos sus macromodelos operan dentro de ese tope biofísico."]],
  bio: [["contenido en", "lim", "Su preservación se mantiene dentro de la capacidad de carga del entorno."],
        ["contiene", "eco", "Asegura la preservación y el equilibrio de todas las formas de vida que habitan la estructura ecocéntrica."]],
  eco: [["abarca", "hidro", "Entiende el agua y la red hidrográfica como la estructura líquida que ordena todo el territorio."],
        ["abarca", "regen", "Exige sanar el suelo pavimentado."],
        ["contenido en", "bio", "El equilibrio de todas las formas de vida contiene la estructura ecocéntrica."],
        ["contenido en", "lim", "Toda la estructura está contenida en la capacidad de carga del entorno."]],
  hidro: [["contenido en", "eco", "Es parte de la estructura ecocéntrica: la estructura líquida que ordena el territorio."],
          ["se articula con", "biocl", "El agua se articula con la vegetación y los suelos permeables, que absorben las lluvias."]],
  biocl: [["se articula con", "hidro", "Recibe el agua de la red hidrográfica: la vegetación y los suelos permeables la absorben y regulan la temperatura de las islas de calor."]],
  regen: [["se conecta con", "circ", "Para sanar el suelo pavimentado se apoya en los insumos que la circularidad reintegra al territorio."],
          ["contenido en", "eco", "Es una de las acciones de intervención dentro del núcleo ecocéntrico."]],
  circ: [["se conecta con", "regen", "Procesa los desechos del sector y los reintegra como nuevos insumos para sanar el suelo."],
         ["contenido en", "eco", "Cierra los ciclos de materia dentro del núcleo ecocéntrico."]]
};

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const INNER = 0.8;  // radio del círculo ecocéntrico
const S = 1.1;      // escala de las burbujas interiores

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

/* posiciones vivas (px) */
function pos(n, t) {
  if (n.ring) {
    const a = n.ang + n.spin * t;
    return { x: L.cx + Math.cos(a) * n.ring * L.R, y: L.cy + Math.sin(a) * n.ring * L.R, r: 0 };
  }
  const dx = Math.sin(t * 0.45 + n.phase) * 0.01, dy = Math.cos(t * 0.38 + n.phase * 1.3) * 0.01;
  return { x: L.cx + (n.x * S + dx) * L.R, y: L.cy + (n.y * S + dy) * L.R, r: n.r * S * L.R * (1 + 0.015 * Math.sin(t * 0.8 + n.phase)) };
}
function satPos(s, t) {
  const p = pos(s.parent, t), a = s.base + 0.18 * Math.sin(t * 0.4 + s.ph);
  const d = p.r + 0.082 * L.R;
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

  // círculos contenedores
  const rings = [["lim", 1.0], ["bio", 0.9], ["eco", INNER]];
  rings.forEach(([id, rr]) => {
    const n = byId[id], al = related(id) ? 1 : 0.3, sel = selected === id || hover === id;
    ctx.strokeStyle = rgba(n.rgb, (id === "eco" ? 0.7 : 0.8) * al + (sel ? 0.2 : 0));
    ctx.lineWidth = sel ? 3 : 2;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, rr * L.R, 0, TAU); ctx.stroke();
  });

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
    const m = n.pulse * 0.3, bg = 0.82 * al;   // sólida: mezcla con negro al atenuar y con blanco al pulsar
    ctx.fillStyle = `rgb(${n.rgb.map(c => Math.round((c + (255 - c) * m) * bg)).join(",")})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + 0.06 * n.pulse), 0, TAU); ctx.fill();
    if (sel) { ctx.strokeStyle = "rgba(245,240,225,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 4, 0, TAU); ctx.stroke(); }
    // etiqueta: dentro del eco, hacia afuera en el resto
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    let tx = p.x, ty = p.y, col = `rgba(8,12,12,${al})`;
    if (n.id !== "eco") {
      const a = Math.atan2(n.y, n.x), d = p.r + fs * 0.9;
      tx += Math.cos(a) * d; ty += Math.sin(a) * d * 0.9; col = `rgba(235,230,215,${al})`;
      ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#000"; ctx.strokeText(n.name, tx, ty);
    }
    ctx.fillStyle = col; ctx.fillText(n.name, tx, ty);
  });

  // fichas sobre los anillos
  ["lim", "bio"].forEach(id => {
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
  for (const id of ["lim", "bio"]) {
    const n = byId[id], p = pos(n, t);
    if (n.pw && Math.abs(x - p.x) < n.pw / 2 + 4 && Math.abs(y - p.y) < n.ph / 2 + 4) return id;
  }
  for (const id of ["biocl", "circ", "regen", "hidro", "eco"]) {
    const p = pos(byId[id], t);
    if (Math.hypot(x - p.x, y - p.y) < p.r + 6) return id;
  }
  const d = Math.hypot(x - L.cx, y - L.cy) / L.R;
  if (d < INNER) return "eco";
  if (d < 0.96) return "bio";
  if (d < 1.08) return "lim";
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

["lim", "bio", "eco", "hidro", "biocl", "regen", "circ"].forEach(id => {
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
