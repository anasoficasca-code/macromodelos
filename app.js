"use strict";

/* ---------- Datos ----------
   Geometría en unidades de R (radio del círculo exterior = 1), centro (0,0). */

const NODES = [
  { id: "lim", name: "Límites Ecológicos", rgb: [148, 163, 184], cx: 0, cy: 0, r: 1.0, ring: true,
    desc: "Contiene toda la estructura: fija la capacidad de carga del entorno." },
  { id: "bio", name: "Biocéntrico", rgb: [129, 140, 248], cx: 0, cy: 0, r: 0.87, ring: true,
    desc: "Asegura la preservación y el equilibrio de todas las formas de vida en el territorio." },
  { id: "eco", name: "Ecocéntrico", rgb: [45, 212, 191], cx: 0, cy: 0, r: 0.74,
    desc: "Punto de partida: la naturaleza como eje ordenador. Abarca a los demás macromodelos del territorio." },
  { id: "hidro", name: "Hidrocéntrico", rgb: [56, 189, 248], cx: -0.22, cy: -0.14, r: 0.34,
    desc: "El agua y la red hidrográfica son la estructura líquida que ordena todo el territorio." },
  { id: "biocl", name: "Bioclimático", rgb: [125, 211, 252], cx: 0.2, cy: -0.27, r: 0.24,
    desc: "La vegetación y los suelos permeables absorben las lluvias y regulan la temperatura de las islas de calor." },
  { id: "regen", name: "Regenerativo", rgb: [167, 139, 250], cx: -0.2, cy: 0.38, r: 0.23,
    desc: "Busca sanar el suelo pavimentado y devolverle su capacidad de vida." },
  { id: "circ", name: "Circularidad", rgb: [232, 121, 249], cx: 0.26, cy: 0.34, r: 0.23,
    desc: "Procesa los desechos del sector para reintegrarlos como nuevos insumos." }
];
const byId = {};
NODES.forEach((n, i) => { byId[n.id] = n; n.phase = i * 1.9; n.pulse = 0; n.amp = n.ring ? 0.004 : 0.02; });

// Relaciones (para el panel)
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

/* ---------- Flujos de gotas ---------- */

const FLOWS = [];
function addBez(from, to, bend, n, speed) {
  const f = { type: "bez", from: byId[from], to: byId[to], bend, nodes: [from, to], drops: [] };
  for (let i = 0; i < n; i++) f.drops.push({ t: i / n + rand(0, 0.05), v: speed * rand(0.85, 1.15) });
  FLOWS.push(f);
}
function addOrbit(id, r, dir, n, speed, nodes) {
  const f = { type: "orbit", id, r, dir, nodes, drops: [] };
  for (let i = 0; i < n; i++) f.drops.push({ t: i / n + rand(0, 0.03), v: speed * rand(0.9, 1.1) });
  FLOWS.push(f);
}
addBez("hidro", "biocl", 0.05, 4, 0.2);
addBez("regen", "circ", -0.16, 3, 0.18);
addBez("circ", "regen", -0.16, 3, 0.18);
addOrbit("lim", 1.0, 1, 6, 0.02, ["lim"]);
addOrbit("bio", 0.87, -1, 7, 0.026, ["bio"]);
addOrbit("eco", 0.74, 1, 6, 0.032, ["eco"]);

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

const dust = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.4, 1.2), s: rand(0.004, 0.014), p: Math.random() * 6 }));

function targetLayout() {
  const wide = W >= 800;
  const top = wide ? 118 : 104;
  const bottom = selected && !wide ? H * 0.46 : 26;
  const left = selected && wide ? 392 : 0;
  const aw = W - left, ah = H - top - bottom;
  return { cx: left + aw / 2, cy: top + ah / 2, R: Math.max(70, Math.min(aw, ah) / 2 - 12) };
}

// centro y radio actuales (px) de un nodo, con deriva suave
function geo(n, t) {
  const dx = Math.sin(t * 0.5 + n.phase) * 0.008, dy = Math.cos(t * 0.42 + n.phase * 1.3) * 0.008;
  const k = n.ring ? 0 : 1;
  return { x: L.cx + (n.cx + dx * k) * L.R, y: L.cy + (n.cy + dy * k) * L.R, r: n.r * L.R * (1 + (n.ring ? 0 : 0.012 * Math.sin(t * 0.9 + n.phase))) };
}

function blobPath(n, g, t) {
  ctx.beginPath();
  const steps = n.ring ? 90 : 72;
  for (let i = 0; i <= steps; i++) {
    const a = i / steps * TAU;
    const w = 1 + n.amp * (Math.sin(3 * a + t * 0.8 + n.phase) + 0.7 * Math.sin(5 * a - t * 1.1 + n.phase * 2));
    const x = g.x + Math.cos(a) * g.r * w, y = g.y + Math.sin(a) * g.r * w;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

const rel = id => {
  const act = selected || hover;
  if (!act || act === id) return true;
  return (RELS[act] || []).some(r => r[1] === id) || (RELS[id] || []).some(r => r[1] === act);
};

function flowPoint(f, t, now) {
  if (f.type === "orbit") {
    const g = geo(byId[f.id], now), a = -Math.PI / 2 + f.dir * t * TAU;
    return [g.x + Math.cos(a) * L.R * f.r, g.y + Math.sin(a) * L.R * f.r];
  }
  const a = geo(f.from, now), b = geo(f.to, now);
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 - dy / len * len * f.bend * 2, cy = (a.y + b.y) / 2 + dx / len * len * f.bend * 2;
  const u = 1 - t;
  return [u * u * a.x + 2 * u * t * cx + t * t * b.x, u * u * a.y + 2 * u * t * cy + t * t * b.y, len];
}

function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.05, (nowMs - (frame.last || nowMs)) / 1000);
  frame.last = nowMs;

  const tl = targetLayout();
  if (!L.init) { Object.assign(L, tl, { init: true }); }
  const k = 1 - Math.exp(-dt * 6);
  L.cx += (tl.cx - L.cx) * k; L.cy += (tl.cy - L.cy) * k; L.R += (tl.R - L.R) * k;
  NODES.forEach(n => { n.pulse = Math.max(0, n.pulse - dt * 1.5); });

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "lighter";
  dust.forEach(d => {
    d.y -= d.s * dt; if (d.y < 0) d.y = 1;
    ctx.fillStyle = `rgba(160,200,190,${0.1 + 0.08 * Math.sin(now + d.p)})`;
    ctx.beginPath(); ctx.arc(d.x * W + Math.sin(now * 0.3 + d.p) * 6, d.y * H, d.r, 0, TAU); ctx.fill();
  });

  // rellenos líquidos (la superposición suma luz)
  NODES.forEach(n => {
    const g = geo(n, now);
    const al = rel(n.id) ? 1 : 0.35;
    const p = n.pulse;
    if (n.id === "lim") return;
    const grad = ctx.createRadialGradient(g.x, g.y, g.r * 0.1, g.x, g.y, g.r);
    if (n.id === "bio") {
      // anillo de vida: banda luminosa entre Biocéntrico y Ecocéntrico
      grad.addColorStop(0.8, rgba(n.rgb, 0)); grad.addColorStop(1, rgba(n.rgb, 0.16 * al));
    } else if (n.id === "eco") {
      grad.addColorStop(0, rgba(n.rgb, 0.03 * al)); grad.addColorStop(1, rgba(n.rgb, (0.14 + 0.1 * p) * al));
    } else {
      grad.addColorStop(0, rgba(n.rgb, (0.1 + 0.15 * p) * al)); grad.addColorStop(1, rgba(n.rgb, (0.34 + 0.2 * p) * al));
    }
    ctx.fillStyle = grad; blobPath(n, g, now); ctx.fill();
  });

  // contornos
  ctx.globalCompositeOperation = "source-over";
  NODES.forEach(n => {
    const g = geo(n, now);
    const al = rel(n.id) ? 1 : 0.3;
    const sel = selected === n.id || hover === n.id;
    ctx.strokeStyle = rgba(n.rgb, (n.ring ? 0.6 : 0.85) * al + (sel ? 0.15 : 0));
    ctx.lineWidth = sel ? 2.6 : n.ring ? 1.4 : 1.8;
    if (n.id === "lim") { ctx.setLineDash([2, 7]); ctx.lineDashOffset = -now * 8; }
    blobPath(n, g, now); ctx.stroke(); ctx.setLineDash([]);
  });

  // gotas
  ctx.globalCompositeOperation = "lighter";
  FLOWS.forEach(f => {
    const act = selected || hover;
    const dim = !act || f.nodes.includes(act) ? 1 : 0.2;
    const col = (f.type === "orbit" ? byId[f.id] : f.from).rgb;

    if (f.type === "bez") {
      // guía tenue del cauce
      ctx.strokeStyle = rgba(col, 0.12 * dim); ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i <= 30; i++) { const p = flowPoint(f, i / 30, now); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
    }
    f.drops.forEach(d => {
      d.t += d.v * dt;
      if (d.t >= 1) { d.t -= 1; if (f.type === "bez") f.to.pulse = 1; }
      const head = flowPoint(f, d.t, now);
      const len = f.type === "orbit" ? TAU * L.R * f.r : head[2];
      const span = Math.min(0.3, 48 / len), trail = 10;
      for (let i = trail; i >= 0; i--) {
        let tt = d.t - span * i / trail;
        if (tt < 0) { if (f.type === "bez") continue; tt += 1; }
        const q = 1 - i / trail, p = flowPoint(f, tt, now);
        ctx.fillStyle = rgba(col, 0.5 * q * q * dim);
        ctx.beginPath(); ctx.arc(p[0], p[1], 0.8 + 2.6 * q, 0, TAU); ctx.fill();
      }
      const gl = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 10);
      gl.addColorStop(0, rgba(col, 0.55 * dim)); gl.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(head[0], head[1], 10, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.9 * dim})`;
      ctx.beginPath(); ctx.arc(head[0], head[1], 2.2, 0, TAU); ctx.fill();
    });
  });

  // etiquetas
  ctx.globalCompositeOperation = "source-over";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const fs = Math.max(9.5, Math.min(15, L.R * 0.062));
  const label = (txt, x, y, n, size, weight, upper) => {
    const al = rel(n.id) ? 1 : 0.35;
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    if (upper) txt = txt.toUpperCase();
    ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#000"; ctx.strokeText(txt, x, y);
    ctx.fillStyle = `rgba(236,241,247,${al})`; ctx.fillText(txt, x, y);
  };
  const G = id => geo(byId[id], now);
  label("Límites Ecológicos", G("lim").x, G("lim").y - G("lim").r, byId.lim, fs * 0.92, 600, true);
  label("Biocéntrico", G("bio").x, G("bio").y + G("bio").r, byId.bio, fs * 0.92, 600, true);
  label("Ecocéntrico", G("eco").x, G("eco").y - G("eco").r * 0.84, byId.eco, fs * 0.92, 600, true);
  ["hidro", "biocl", "regen", "circ"].forEach(id => {
    const g = G(id), n = byId[id];
    const bump = id === "biocl" ? -g.r * 0.12 : 0;
    label(n.name, g.x, g.y + bump, n, fs, 600, false);
  });

  requestAnimationFrame(frame);
}

/* ---------- Interacción ---------- */

function pick(x, y) {
  const now = performance.now() / 1000;
  for (const id of ["biocl", "circ", "regen", "hidro"]) {
    const g = geo(byId[id], now);
    if (Math.hypot(x - g.x, y - g.y) < g.r) return id;
  }
  const d = Math.hypot(x - L.cx, y - L.cy) / L.R;
  if (d < 0.74) return "eco";
  if (d < 0.94) return "bio";
  if (d < 1.1) return "lim";
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
