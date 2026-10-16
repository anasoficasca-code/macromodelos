"use strict";

/* ---------- Datos ---------- */

const NODES = [
  { id: "eco", name: "Ecocéntrico", rgb: [88, 168, 156], r: 17, p: [0, 0],
    desc: "Punto de partida de la red: abarca al Macromodelo Hidrocéntrico." },
  { id: "hidro", name: "Hidrocéntrico", rgb: [96, 152, 184], r: 13, p: [1, -0.45],
    desc: "El agua y la red hídrica son la estructura viva que ordena el territorio." },
  { id: "regen", name: "Regenerativo", rgb: [185, 125, 98], r: 13, p: [2, 0.05],
    desc: "Regeneración activa de los ecosistemas degradados: reconstruye los corredores ecológicos que la urbanización fragmentó y reactiva la regulación térmica y biótica del territorio." },
  { id: "com", name: "Comercio Ecológico", rgb: [150, 176, 125], r: 15, p: [3, -0.4],
    desc: "Reestructura el comercio mayorista, las plazas de mercado y las ventas informales para que funcionen como redes de abastecimiento limpio." },
  { id: "circ", name: "Circularidad", rgb: [214, 196, 140], r: 12, p: [3.4, 0.7],
    desc: "Reincorpora los volúmenes de residuos orgánicos como nuevos insumos dentro del ciclo local." },
  { id: "lim", name: "Límites Ecológicos", rgb: [170, 164, 146], r: 13, p: [4.1, -0.95],
    desc: "Ajusta el transporte de carga, la logística y la movilidad para que toda la dinámica opere dentro de sus límites." },
  { id: "bio", name: "Biocéntrico", rgb: [196, 163, 105], r: 16, p: [5.1, -0.35],
    desc: "Asegura la preservación y la continuidad de todas las formas de vida en Kennedy." }
];
const byId = {};
NODES.forEach(n => { byId[n.id] = n; n.r *= 1.35; });

// source → target = sentido del flujo. sv / tv: cómo se lee la relación desde cada extremo.
const LINKS = [
  { source: "eco", target: "hidro", sv: "abarca a", tv: "es abarcado por",
    text: "Reconoce que el agua y la red hídrica son la estructura viva que ordena el territorio." },
  { source: "hidro", target: "regen", sv: "se articula con", tv: "se articula con",
    text: "Para permitir que los flujos naturales vuelvan a conectarse." },
  { source: "regen", target: "com", sv: "se enlaza con", tv: "se enlaza con",
    text: "La regeneración del entorno se enlaza con la reestructuración del comercio como redes de abastecimiento limpio." },
  { source: "circ", target: "com", sv: "sostiene a", tv: "se apoya en",
    text: "La actividad comercial reincorpora los volúmenes de residuos orgánicos como nuevos insumos dentro del ciclo local." },
  { source: "com", target: "lim", sv: "se ajusta a", tv: "ajusta a",
    text: "Toda la dinámica ajusta el transporte de carga, la logística y la movilidad dentro de los límites ecológicos." },
  { source: "lim", target: "bio", sv: "se mantiene bajo", tv: "enmarca a",
    text: "Garantiza que la intensidad del comercio y las dinámicas populares coexistan en equilibrio, asegurando la continuidad de todas las formas de vida." }
];

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const TAU = Math.PI * 2;

/* ---------- Estado ---------- */

let selected = null, hover = null;
const active = () => selected || hover;
const neighbors = id => {
  const s = new Set([id]);
  LINKS.forEach(l => {
    const a = typeof l.source === "object" ? l.source.id : l.source;
    const b = typeof l.target === "object" ? l.target.id : l.target;
    if (a === id) s.add(b);
    if (b === id) s.add(a);
  });
  return s;
};
const linkIds = l => [typeof l.source === "object" ? l.source.id : l.source, typeof l.target === "object" ? l.target.id : l.target];
const linkOn = l => { const a = active(); return !a || linkIds(l).includes(a); };

/* ---------- Grafo ---------- */

const el = document.getElementById("graph");
const SCALE = 150;

const Graph = ForceGraph()(el)
  .backgroundColor("#000")
  .graphData({ nodes: NODES, links: LINKS })
  .nodeRelSize(1)
  .nodeVal(n => n.r * n.r)
  .cooldownTicks(0)
  .enableNodeDrag(true)
  .linkCurvature(0.14)
  .linkWidth(l => (linkOn(l) && active() ? 2.6 : 1.6))
  .linkColor(l => (linkOn(l) ? "rgba(205,210,200,0.38)" : "rgba(205,210,200,0.07)"))
  .linkDirectionalParticles(4)
  .linkDirectionalParticleSpeed(0.004)
  .linkDirectionalParticleWidth(5.5)
  .linkDirectionalParticleColor(l => rgba(l.source.rgb, linkOn(l) ? 0.95 : 0.2))
  .nodeCanvasObject((n, ctx, k) => {
    const a = active();
    const dim = a && !neighbors(a).has(n.id);
    const sel = a === n.id;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, TAU);
    ctx.fillStyle = rgba(n.rgb, dim ? 0.25 : 1); ctx.fill();
    if (sel) { ctx.lineWidth = 2 / k; ctx.strokeStyle = "rgba(245,240,225,.95)"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4 / k, 0, TAU); ctx.stroke(); }
    const fs = 13 / k;
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.lineJoin = "round"; ctx.lineWidth = 4 / k; ctx.strokeStyle = "#000";
    ctx.strokeText(n.name, n.x, n.y + n.r + 5 / k);
    ctx.fillStyle = dim ? "rgba(232,228,214,.35)" : "rgba(238,234,220,1)";
    ctx.fillText(n.name, n.x, n.y + n.r + 5 / k);
  })
  .nodePointerAreaPaint((n, color, ctx) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 6, 0, TAU); ctx.fill(); })
  .onNodeHover(n => { hover = n ? n.id : null; el.style.cursor = n ? "pointer" : "default"; })
  .onNodeClick(n => { document.getElementById("hint").classList.add("off"); select(selected === n.id ? null : n.id); })
  .onBackgroundClick(() => { if (selected) select(null); });

// Posiciones fijas y ordenadas; se giran en pantallas verticales
function place() {
  const portrait = el.clientWidth < el.clientHeight;
  NODES.forEach(n => {
    const [x, y] = n.p;
    n.fx = (portrait ? y * 1.15 : x) * SCALE;
    n.fy = (portrait ? x : y * 1.15) * SCALE;
    n.x = n.fx; n.y = n.fy;
  });
}

function fit(ms) { Graph.zoomToFit(ms, 54); }

/* ---------- Área disponible ---------- */

function area() {
  const W = window.innerWidth, H = window.innerHeight, wide = W >= 800;
  const top = wide ? 118 : 104;
  const left = selected && wide ? 392 : 0;
  const bottom = selected && !wide ? Math.round(H * 0.44) : 0;
  el.style.left = left + "px"; el.style.top = top + "px";
  Graph.width(W - left).height(H - top - bottom);
}

function relayout(ms) { area(); place(); Graph.graphData({ nodes: NODES, links: LINKS }); setTimeout(() => fit(ms), 30); }
window.addEventListener("resize", () => relayout(0));

/* ---------- Panel y chips ---------- */

const panel = document.getElementById("panel");
const chips = document.getElementById("chips");

NODES.forEach(n => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.dataset.id = n.id;
  b.style.setProperty("--c", rgba(n.rgb, 1));
  b.setAttribute("aria-pressed", "false");
  b.innerHTML = `<i></i>${n.name}`;
  b.addEventListener("click", () => select(selected === n.id ? null : n.id));
  chips.appendChild(b);
});

function select(id) {
  selected = id;
  chips.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  if (!id) { panel.hidden = true; area(); fit(400); return; }
  const n = byId[id];
  panel.style.setProperty("--c", rgba(n.rgb, 1));
  document.getElementById("p-title").innerHTML = `<i></i>${n.name}`;
  document.getElementById("p-desc").textContent = n.desc;
  const items = [];
  LINKS.forEach(l => {
    const [a, b] = linkIds(l);
    if (a === id) items.push([l.sv, byId[b], l.text]);
    else if (b === id) items.push([l.tv, byId[a], l.text]);
  });
  document.getElementById("p-links").innerHTML = items.map(r =>
    `<li style="--c:${rgba(r[1].rgb, 1)}"><b><span class="dir">${r[0]}</span>${r[1].name}</b>${r[2]}</li>`).join("");
  panel.scrollTop = 0;
  panel.hidden = false;
  area(); fit(400);
}
document.getElementById("close").addEventListener("click", () => select(null));
window.addEventListener("keydown", e => { if (e.key === "Escape") select(null); });

relayout(0);
