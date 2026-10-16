"use strict";

/* ---------- Datos ----------
   Ecocéntrico es la esfera grande. Hidrocéntrico y Biocéntrico viven dentro de ella;
   Regenerativo, Comercio, Circularidad y Límites están afuera y se conectan con todos. */

const ECO_R = 210;

const NODES = [
  { id: "eco", name: "Ecocéntrico", rgb: [88, 168, 156], r: ECO_R, x: 0, y: 0,
    desc: "La esfera mayor y punto de partida: abarca al Hidrocéntrico y al Biocéntrico, y se articula con el Regenerativo." },
  { id: "hidro", name: "Hidrocéntrico", rgb: [96, 152, 184], r: 33, x: -85, y: -20, inside: true,
    desc: "El agua y la red hídrica son la estructura viva que ordena el territorio." },
  { id: "bio", name: "Biocéntrico", rgb: [196, 163, 105], r: 37, x: 85, y: 60, inside: true,
    desc: "Asegura la preservación y la continuidad de todas las formas de vida en Kennedy." },
  { id: "regen", name: "Regenerativo", rgb: [185, 125, 98], r: 28, x: -330, y: 190,
    desc: "Regeneración activa de los ecosistemas degradados: reconstruye los corredores ecológicos que la urbanización fragmentó y reactiva la regulación térmica y biótica del territorio." },
  { id: "com", name: "Comercio Ecológico", rgb: [150, 176, 125], r: 32, x: 20, y: 350,
    desc: "Reestructura el comercio mayorista, las plazas de mercado y las ventas informales para que funcionen como redes de abastecimiento limpio." },
  { id: "circ", name: "Circularidad", rgb: [214, 196, 140], r: 25, x: 330, y: 200,
    desc: "Reincorpora los volúmenes de residuos orgánicos como nuevos insumos dentro del ciclo local." },
  { id: "lim", name: "Límites Ecológicos", rgb: [170, 164, 146], r: 32, x: 330, y: -190,
    desc: "Ajusta el transporte de carga, la logística y la movilidad para que toda la dinámica opere dentro de sus límites." }
];
const byId = {};
NODES.forEach(n => { byId[n.id] = n; });
byId.eco.fx = 0; byId.eco.fy = 0;

// source → target = sentido del flujo. sv / tv: cómo se lee la relación desde cada extremo.
const FLOW = [
  { source: "hidro", target: "regen", sv: "se articula con", tv: "se articula con",
    text: "Para permitir que los flujos naturales vuelvan a conectarse." },
  { source: "regen", target: "com", sv: "se enlaza con", tv: "se enlaza con",
    text: "La regeneración del entorno se enlaza con la reestructuración del comercio como redes de abastecimiento limpio." },
  { source: "circ", target: "com", sv: "sostiene a", tv: "se apoya en",
    text: "La actividad comercial reincorpora los volúmenes de residuos orgánicos como nuevos insumos dentro del ciclo local." },
  { source: "circ", target: "regen", sv: "alimenta a", tv: "se nutre de",
    text: "Los residuos orgánicos vuelven como nuevos insumos dentro del ciclo local, alimentando la regeneración del entorno." },
  { source: "com", target: "lim", sv: "se ajusta a", tv: "ajusta a",
    text: "Toda la dinámica ajusta el transporte de carga, la logística y la movilidad dentro de los límites ecológicos." },
  { source: "lim", target: "bio", sv: "se mantiene bajo", tv: "enmarca a",
    text: "Garantiza que la intensidad del comercio y las dinámicas populares coexistan en equilibrio, asegurando la continuidad de todas las formas de vida." },
  { source: "hidro", target: "bio", sv: "se orienta a", tv: "orienta a",
    text: "El agua sostiene la preservación y continuidad de las formas de vida." }
];
["hidro", "regen", "circ"].forEach(id => FLOW.push({ source: id, target: "lim", sv: "opera dentro de", tv: "contiene a",
  text: "Su dinámica se ajusta a los límites ecológicos: transporte de carga, logística y movilidad incluidos." }));
["regen", "circ", "com"].forEach(id => FLOW.push({ source: id, target: "bio", sv: "se orienta a", tv: "orienta a",
  text: "Su dinámica se orienta a la preservación y continuidad de todas las formas de vida en Kennedy." }));

// Relaciones del Ecocéntrico (la esfera): se muestran en el panel, no como líneas
const ECO_LINKS = [
  { source: "eco", target: "hidro", sv: "abarca a", tv: "es abarcado por",
    text: "Reconoce que el agua y la red hídrica son la estructura viva que ordena el territorio." },
  { source: "eco", target: "bio", sv: "abarca a", tv: "es abarcado por",
    text: "Dentro del núcleo ecocéntrico se asegura la preservación y continuidad de todas las formas de vida." },
  { source: "eco", target: "regen", sv: "se articula con", tv: "se articula con",
    text: "Para permitir que los flujos naturales vuelvan a conectarse, el núcleo se articula con la regeneración activa de los ecosistemas." }
];
const ALL_LINKS = FLOW.concat(ECO_LINKS);

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const TAU = Math.PI * 2;

/* ---------- Estado ---------- */

let selected = null, hover = null;
const active = () => selected || hover;
const ids = l => [typeof l.source === "object" ? l.source.id : l.source, typeof l.target === "object" ? l.target.id : l.target];
const neighbors = id => {
  const s = new Set([id]);
  ALL_LINKS.forEach(l => { const [a, b] = ids(l); if (a === id) s.add(b); if (b === id) s.add(a); });
  return s;
};
const linkOn = l => { const a = active(); return !a || ids(l).includes(a); };

/* ---------- Grafo ---------- */

const el = document.getElementById("graph");

const Graph = ForceGraph()(el)
  .backgroundColor("#000")
  .graphData({ nodes: NODES, links: FLOW })
  .nodeRelSize(1)
  .warmupTicks(260)
  .cooldownTime(6000)
  .enableNodeDrag(true)
  .linkCurvature(0.12)
  .linkWidth(l => (linkOn(l) && active() ? 2.6 : 1.6))
  .linkColor(l => (linkOn(l) ? "rgba(205,210,200,0.4)" : "rgba(205,210,200,0.07)"))
  .linkDirectionalParticles(3)
  .linkDirectionalParticleSpeed(0.004)
  .linkDirectionalParticleWidth(5)
  .linkDirectionalParticleColor(l => rgba(l.source.rgb, linkOn(l) ? 0.95 : 0.2))

  // La esfera ecocéntrica se pinta antes que líneas y nodos
  .onRenderFramePre((ctx, k) => {
    const e = byId.eco, sel = active() === "eco";
    const g = ctx.createRadialGradient(0, 0, ECO_R * 0.2, 0, 0, ECO_R);
    g.addColorStop(0, rgba(e.rgb, 0.05)); g.addColorStop(1, rgba(e.rgb, 0.2));
    ctx.beginPath(); ctx.arc(0, 0, ECO_R, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = (sel ? 4 : 3) / Math.min(k, 1.5); ctx.strokeStyle = rgba(e.rgb, sel ? 1 : 0.85); ctx.stroke();
  })

  .nodeCanvasObject((n, ctx, k) => {
    const a = active();
    if (n.id === "eco") {
      const fs = 18 / k;
      ctx.font = `700 ${fs}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(150,215,200,1)"; ctx.fillText("ECOCÉNTRICO", 0, -ECO_R + 30 / k);
      return;
    }
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
  .nodePointerAreaPaint((n, color, ctx) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, n.id === "eco" ? ECO_R : n.r + 6, 0, TAU); ctx.fill();
  })
  .onNodeHover(n => { hover = n ? n.id : null; el.style.cursor = n ? "pointer" : "default"; })
  .onNodeClick(n => { document.getElementById("hint").classList.add("off"); select(selected === n.id ? null : n.id); })
  .onBackgroundClick(() => { if (selected) select(null); });

// Fuerzas: los vínculos atraen y los nodos se repelen; la esfera pesa 0 en la repulsión
Graph.d3Force("charge").strength(n => (n.id === "eco" ? 0 : -520));
Graph.d3Force("link").distance(250).strength(0.12);
// Contención: Hidro y Bio se quedan dentro de la esfera; el resto, afuera
Graph.d3Force("contain", (() => {
  let nodes = [];
  const f = () => {
    nodes.forEach(n => {
      if (n.id === "eco") return;
      const d = Math.hypot(n.x, n.y) || 1;
      if (n.inside && n.y < -ECO_R * 0.3) n.y = -ECO_R * 0.3;   // deja libre el título de la esfera
      const lim = n.inside ? ECO_R - n.r - 22 : ECO_R + n.r + 70;
      if ((n.inside && d > lim) || (!n.inside && d < lim)) { n.x *= lim / d; n.y *= lim / d; n.vx = n.vy = 0; }
    });
  };
  f.initialize = ns => { nodes = ns; };
  return f;
})());

function fit(ms) { Graph.zoomToFit(ms, 50); }

/* ---------- Área disponible ---------- */

function area() {
  const W = window.innerWidth, H = window.innerHeight, wide = W >= 800;
  const top = wide ? 118 : 104;
  const left = selected && wide ? 392 : 0;
  const bottom = selected && !wide ? Math.round(H * 0.44) : 0;
  el.style.left = left + "px"; el.style.top = top + "px";
  Graph.width(W - left).height(H - top - bottom);
}

function relayout(ms) { area(); setTimeout(() => fit(ms), 30); }
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
  ALL_LINKS.forEach(l => {
    const [a, b] = ids(l);
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
