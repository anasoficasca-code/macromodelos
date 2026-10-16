"use strict";

/* ---------- Datos ----------
   Ecocéntrico es la esfera grande. Hidrocéntrico y Biocéntrico viven dentro de ella;
   Regenerativo, Comercio, Circularidad y Límites están afuera. */

const NODES = [
  { id: "eco", name: "Ecocéntrico", rgb: [88, 168, 156],
    desc: "La esfera mayor y punto de partida: abarca al Hidrocéntrico y al Biocéntrico, y se articula con el Regenerativo." },
  { id: "hidro", name: "Hidrocéntrico", sub: "El agua como estructura viva", rgb: [96, 152, 184], inside: true,
    icon: "M12 3 C12 3 6 10 6 14.5 a6 6 0 0 0 12 0 C18 10 12 3 12 3 Z",
    desc: "El agua y la red hídrica son la estructura viva que ordena el territorio." },
  { id: "bio", name: "Biocéntrico", sub: "Preservación de la vida", rgb: [196, 163, 105], inside: true,
    icon: "M12 20 C5 14 3 10 3 7.5 A4.5 4.5 0 0 1 12 6 A4.5 4.5 0 0 1 21 7.5 C21 10 19 14 12 20 Z",
    desc: "Asegura la preservación y la continuidad de todas las formas de vida en Kennedy." },
  { id: "regen", name: "Regenerativo", sub: "Corredores y ecosistemas", rgb: [185, 125, 98],
    icon: "M12 21 V11 M12 11 C12 7 9 5 5 5 C5 9 8 11 12 11 M12 14 C12 10 15 8 19 8 C19 12 16 14 12 14",
    desc: "Regeneración activa de los ecosistemas degradados: reconstruye los corredores ecológicos que la urbanización fragmentó y reactiva la regulación térmica y biótica del territorio." },
  { id: "com", name: "Comercio Ecológico", sub: "Abastecimiento limpio", rgb: [150, 176, 125],
    icon: "M4 9 H20 L18.5 19 H5.5 Z M8 9 L11 4 M16 9 L13 4",
    desc: "Reestructura el comercio mayorista, las plazas de mercado y las ventas informales para que funcionen como redes de abastecimiento limpio." },
  { id: "circ", name: "Circularidad", sub: "Residuos que vuelven como insumos", rgb: [214, 196, 140],
    icon: "M20 12 a8 8 0 0 1 -13.5 5.8 M4 12 a8 8 0 0 1 13.5 -5.8 M17.5 3 V6.5 H14 M6.5 21 V17.5 H10",
    desc: "Reincorpora los volúmenes de residuos orgánicos como nuevos insumos dentro del ciclo local." },
  { id: "lim", name: "Límites Ecológicos", sub: "Carga, logística y movilidad", rgb: [170, 164, 146],
    icon: "M4 18 A9 9 0 0 1 20 18 M12 18 L16 11 M4 18 H20",
    desc: "Ajusta el transporte de carga, la logística y la movilidad para que toda la dinámica opere dentro de sus límites." }
];
const byId = {};
NODES.forEach(n => { byId[n.id] = n; if (n.icon) n.path = new Path2D(n.icon); });

// source → target = sentido del flujo. sv / tv: cómo se lee la relación desde cada extremo.
const FLOW = [
  { source: "hidro", target: "regen", sv: "se articula con", tv: "se articula con",
    text: "Para permitir que los flujos naturales vuelvan a conectarse." },
  { source: "regen", target: "com", sv: "se enlaza con", tv: "se enlaza con",
    text: "La regeneración del entorno se enlaza con la reestructuración del comercio como redes de abastecimiento limpio." },
  { source: "circ", target: "com", sv: "sostiene a", tv: "se apoya en",
    text: "La actividad comercial reincorpora los volúmenes de residuos orgánicos como nuevos insumos dentro del ciclo local." },
  { source: "com", target: "lim", sv: "se ajusta a", tv: "ajusta a",
    text: "Toda la dinámica ajusta el transporte de carga, la logística y la movilidad dentro de los límites ecológicos." },
  { source: "lim", target: "bio", sv: "se mantiene bajo", tv: "enmarca a",
    text: "Garantiza que la intensidad del comercio y las dinámicas populares coexistan en equilibrio, asegurando la continuidad de todas las formas de vida." },
  { source: "hidro", target: "bio", sv: "se orienta a", tv: "orienta a",
    text: "El agua sostiene la preservación y continuidad de las formas de vida." },
  { source: "com", target: "bio", sv: "se orienta a", tv: "orienta a",
    text: "La intensidad del comercio coexiste en equilibrio con la preservación de la vida." },
  { source: "regen", target: "bio", sv: "se orienta a", tv: "orienta a",
    text: "La regeneración de los ecosistemas sostiene la continuidad de las formas de vida." }
];

// Relaciones del Ecocéntrico (la esfera): se muestran en el panel, no como líneas
const ECO_LINKS = [
  { source: "eco", target: "hidro", sv: "abarca a", tv: "es abarcado por",
    text: "Reconoce que el agua y la red hídrica son la estructura viva que ordena el territorio." },
  { source: "eco", target: "bio", sv: "abarca a", tv: "es abarcado por",
    text: "Dentro del núcleo ecocéntrico se asegura la preservación y continuidad de todas las formas de vida." },
  { source: "eco", target: "regen", sv: "se articula con", tv: "se articula con",
    text: "Para permitir que los flujos naturales vuelvan a conectarse, el núcleo se articula con la regeneración activa de los ecosistemas." },
  { source: "circ", target: "regen", sv: "alimenta a", tv: "se nutre de",
    text: "Los residuos orgánicos vuelven como insumos dentro del ciclo local, alimentando la regeneración del entorno." },
  { source: "circ", target: "lim", sv: "opera dentro de", tv: "contiene a",
    text: "Su dinámica se ajusta a los límites ecológicos." }
];
const ALL_LINKS = FLOW.concat(ECO_LINKS);

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const TAU = Math.PI * 2;
const SPH = { x: 0, y: 0, R: 200 };   // esfera ecocéntrica (se recalcula en layout)

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
const mctx = document.createElement("canvas").getContext("2d");

function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

const Graph = ForceGraph()(el)
  .backgroundColor("#000")
  .graphData({ nodes: NODES, links: FLOW })
  .cooldownTicks(0)
  .enableNodeDrag(true)
  .linkCurvature(0.08)
  .linkWidth(l => (linkOn(l) && active() ? 2.6 : 1.6))
  .linkColor(l => (linkOn(l) ? "rgba(205,210,200,0.45)" : "rgba(205,210,200,0.08)"))
  .linkDirectionalParticles(3)
  .linkDirectionalParticleSpeed(0.004)
  .linkDirectionalParticleWidth(4.5)
  .linkDirectionalParticleColor(l => rgba(l.source.rgb, linkOn(l) ? 0.95 : 0.2))

  // Esfera de cristal: se pinta antes que líneas y tarjetas
  .onRenderFramePre(ctx => {
    const e = byId.eco, sel = active() === "eco", { x, y, R } = SPH;
    const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.05, x, y, R);
    g.addColorStop(0, rgba([150, 225, 210], 0.24)); g.addColorStop(0.55, rgba(e.rgb, 0.08)); g.addColorStop(1, rgba([30, 90, 82], 0.2));
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = sel ? 4 : 2.5; ctx.strokeStyle = rgba([130, 210, 195], sel ? 1 : 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R + 9, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = rgba(e.rgb, 0.25); ctx.stroke();
  })

  .nodeCanvasObject((n, ctx) => {
    const a = active();
    if (n.id === "eco") {
      ctx.font = `700 ${Math.max(13, SPH.R * 0.085)}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(160,225,210,1)"; ctx.fillText("ECOCÉNTRICO", SPH.x, SPH.y - SPH.R * 0.8);
      return;
    }
    const dim = a && !neighbors(a).has(n.id), sel = a === n.id, al = dim ? 0.3 : 1;
    const { w, h } = n, x = n.x - w / 2, y = n.y - h / 2;
    roundRect(ctx, x, y, w, h, h * 0.3); ctx.fillStyle = `rgba(10,14,13,${dim ? 0.6 : 0.96})`; ctx.fill();
    ctx.lineWidth = sel ? 2.6 : 1.6; ctx.strokeStyle = sel ? "rgba(245,240,225,.95)" : rgba(n.rgb, 0.9 * al); ctx.stroke();
    // icono
    const ic = h - 16, ix = x + 8, iy = y + 8;
    roundRect(ctx, ix, iy, ic, ic, ic * 0.3); ctx.fillStyle = rgba(n.rgb, 0.22 * al); ctx.fill();
    ctx.save(); ctx.translate(ix + ic * 0.15, iy + ic * 0.15); ctx.scale(ic * 0.7 / 24, ic * 0.7 / 24);
    ctx.lineWidth = 1.9; ctx.lineCap = ctx.lineJoin = "round"; ctx.strokeStyle = rgba(n.rgb, al); ctx.stroke(n.path); ctx.restore();
    // texto
    const tx = x + h + 2;
    ctx.textAlign = "left"; ctx.textBaseline = n.showSub ? "alphabetic" : "middle";
    ctx.font = `700 ${n.fs}px system-ui, sans-serif`; ctx.fillStyle = `rgba(240,236,224,${al})`;
    ctx.fillText(n.name, tx, n.showSub ? n.y - 2 : n.y);
    if (n.showSub) { ctx.font = `500 11px system-ui, sans-serif`; ctx.fillStyle = `rgba(160,168,160,${al})`; ctx.fillText(n.sub, tx, n.y + 14); }
  })
  .nodePointerAreaPaint((n, color, ctx) => {
    ctx.fillStyle = color;
    if (n.id === "eco") { ctx.beginPath(); ctx.arc(SPH.x, SPH.y, SPH.R, 0, TAU); ctx.fill(); }
    else ctx.fillRect(n.x - n.w / 2, n.y - n.h / 2, n.w, n.h);
  })
  .onNodeHover(n => { hover = n ? n.id : null; el.style.cursor = n ? "pointer" : "default"; })
  .onNodeClick(n => { document.getElementById("hint").classList.add("off"); select(selected === n.id ? null : n.id); })
  .onBackgroundClick(() => { if (selected) select(null); });

/* ---------- Distribución (en píxeles, ordenada y sin cruces) ---------- */

function put(id, x, y) { const n = byId[id]; n.fx = n.x = x; n.fy = n.y = y; }

function layout(aw, ah) {
  const compact = aw < 700, portrait = aw < ah * 0.95;

  NODES.forEach(n => {
    if (n.id === "eco") return;
    n.fs = compact ? 13 : 15; n.showSub = !compact; n.h = compact ? 46 : 58;
    mctx.font = `700 ${n.fs}px system-ui, sans-serif`;
    let tw = mctx.measureText(n.name).width;
    if (n.showSub) { mctx.font = "500 11px system-ui, sans-serif"; tw = Math.max(tw, mctx.measureText(n.sub).width); }
    n.w = tw + n.h + 20;
  });

  if (!portrait) {
    const R = Math.min(ah * 0.27, aw * 0.17);
    Object.assign(SPH, { x: 0, y: 0, R });
    put("eco", 0, 0);
    put("hidro", 0, -0.3 * R); put("bio", 0, 0.4 * R);
    put("regen", -1.95 * R, 0.15 * R); put("lim", 2.0 * R, -0.3 * R);
    put("com", 0, 1.38 * R); put("circ", 1.55 * R, 1.08 * R);
  } else {
    const R = Math.min(aw * 0.4, ah * 0.2), y0 = -ah / 2 + R + 18;
    Object.assign(SPH, { x: 0, y: y0, R });
    put("eco", 0, y0);
    put("hidro", 0, y0 - 0.25 * R); put("bio", 0, y0 + 0.38 * R);
    const y1 = y0 + R + ah * 0.1;
    put("regen", -aw * 0.27, y1); put("lim", aw * 0.27, y1);
    put("com", 0, y1 + ah * 0.17); put("circ", 0, y1 + ah * 0.31);
  }
  Graph.zoom(1, 0); Graph.centerAt(0, 0, 0);
}

/* ---------- Área disponible ---------- */

function area() {
  const W = window.innerWidth, H = window.innerHeight, wide = W >= 800;
  const top = wide ? 118 : 104;
  const left = selected && wide ? 392 : 0;
  const bottom = selected && !wide ? Math.round(H * 0.44) : 0;
  el.style.left = left + "px"; el.style.top = top + "px";
  const aw = W - left, ah = H - top - bottom;
  el.style.width = aw + "px"; el.style.height = ah + "px";
  Graph.width(aw).height(ah);
  layout(aw, ah);
}
window.addEventListener("resize", area);

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
  if (!id) { panel.hidden = true; area(); return; }
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
  area();
}
document.getElementById("close").addEventListener("click", () => select(null));
window.addEventListener("keydown", e => { if (e.key === "Escape") select(null); });

area();
