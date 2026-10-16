"use strict";

/* ---------- Datos ---------- */

const NODES = [
  { id: "eco", name: "Ecocéntrico", rgb: [74, 222, 128], core: true,
    desc: "El núcleo central: la naturaleza es el eje ordenador del territorio." },
  { id: "hidro", name: "Hidrocéntrico", rgb: [56, 189, 248],
    desc: "El agua como principal manifestación territorial: el Humedal El Burro y los cuerpos hídricos." },
  { id: "biocl", name: "Bioclimático", rgb: [251, 191, 36],
    desc: "Regulación térmica con vegetación y agua para mitigar las islas de calor." },
  { id: "regen", name: "Regenerativo", rgb: [190, 242, 100],
    desc: "Sanar y recuperar el suelo y el agua degradados por el concreto." },
  { id: "circ", name: "Circularidad", rgb: [167, 139, 250],
    desc: "Metabolismo circular: cerrar los ciclos de materia y energía, cero desechos." },
  { id: "lim", name: "Límites Ecológicos", rgb: [251, 113, 133],
    desc: "El tope biofísico: la capacidad de carga que el ecosistema puede soportar." },
  { id: "bio", name: "Biocéntrico", rgb: [244, 114, 182],
    desc: "La preservación de la vida de todas las especies que habitan el territorio." }
];

// Conexiones dirigidas "origen>destino"
const TEXT = {
  "eco>hidro": "La naturaleza es el eje ordenador y su principal manifestación territorial es el agua: el Humedal El Burro y los cuerpos hídricos.",
  "eco>bio": "Prioriza el soporte biológico, lo que enlaza directamente con la preservación de la vida de todas las especies del territorio.",
  "eco>regen": "Para que la naturaleza esté en el centro, el territorio exige sanar y recuperar el suelo y el agua degradados por el concreto.",
  "hidro>biocl": "El agua y los cuerpos hídricos regulan, junto con la vegetación, la temperatura superficial y mitigan las islas de calor.",
  "hidro>eco": "Ordena la estructura principal de la cuenca hídrica como base de todo el sistema vivo.",
  "biocl>regen": "La regulación térmica se logra con la recuperación biótica y devolviendo zonas verdes al territorio pavimentado.",
  "biocl>hidro": "La vegetación y el agua trabajan juntas para enfriar y absorber la escorrentía pluvial.",
  "regen>circ": "Para sanar suelo y agua es indispensable cerrar los ciclos metabólicos y lograr «cero desechos» que saturen el entorno.",
  "regen>eco": "Es la acción directa de intervención que devuelve al soporte biológico su capacidad vital.",
  "circ>regen": "Los flujos circulares, como transformar residuos orgánicos en abono, alimentan la recuperación del suelo biótico.",
  "circ>lim": "Al cerrar los ciclos de materia y energía se evita desbordar la capacidad de carga del ecosistema.",
  "lim>circ": "Establece el tope biofísico que obliga al territorio a adoptar sistemas circulares para no colapsar.",
  "lim>bio": "Sostiene los límites de tolerancia ambiental necesarios para garantizar la preservación de las especies y la vida.",
  "bio>lim": "La protección de la vida de todos los seres vivos fija los topes máximos de contaminación y presión tolerables.",
  "bio>eco": "Valida la prioridad absoluta del soporte biológico frente a la especulación inmobiliaria."
};

const byId = {};
NODES.forEach((n, i) => { byId[n.id] = n; n.i = i; n.x = n.y = 0; n.pulse = 0; n.phase = i * 1.7; n.drag = null; });

// Aristas no dirigidas (cada una lleva un flujo en cada sentido)
const EDGES = [];
const seen = new Set();
Object.keys(TEXT).forEach(k => {
  const [a, b] = k.split(">");
  const key = [a, b].sort().join("|");
  if (seen.has(key)) return;
  seen.add(key);
  EDGES.push({ a: byId[a], b: byId[b], spoke: a === "eco" || b === "eco", flows: [] });
});

// Posiciones en anillo (sentido horario desde arriba)
const RING = ["hidro", "biocl", "regen", "circ", "lim", "bio"];
const rand = (a, b) => a + Math.random() * (b - a);

EDGES.forEach(e => {
  [[e.a, e.b], [e.b, e.a]].forEach(([from, to]) => {
    for (let i = 0; i < 3; i++) {
      e.flows.push({ from, to, t: (i + Math.random() * 0.6) / 3, v: rand(55, 95) });
    }
  });
});

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* ---------- Canvas ---------- */

const cv = document.getElementById("net");
const ctx = cv.getContext("2d");
let W = 0, H = 0, dpr = 1;
let selected = null, hover = null;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const dust = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.4, 1.3), s: rand(0.004, 0.015), p: Math.random() * 6 }));

function layout() {
  const wide = W >= 800;
  const top = wide ? 130 : 112;
  const bottom = selected && !wide ? H * 0.46 : 36;
  const left = selected && wide ? 400 : 0;
  const aw = W - left, ah = H - top - bottom;
  const cx = left + aw / 2, cy = top + ah / 2;
  let rx = Math.max(70, aw / 2 - 64), ry = Math.max(70, ah / 2 - 44);
  rx = Math.min(rx, ry * 1.6); ry = Math.min(ry, rx * 1.6);
  return { cx, cy, rx, ry, s: Math.max(0.7, Math.min(1.15, Math.min(aw, ah) / 620)) };
}

function targetOf(n, L, t) {
  if (n.drag) return n.drag;
  let x = L.cx, y = L.cy;
  if (!n.core) {
    const ang = -Math.PI / 2 + RING.indexOf(n.id) * (Math.PI * 2 / RING.length);
    x += Math.cos(ang) * L.rx; y += Math.sin(ang) * L.ry;
  }
  const amp = n.core ? 3 : 7;
  return { x: x + Math.sin(t * 0.6 + n.phase) * amp, y: y + Math.cos(t * 0.5 + n.phase * 1.3) * amp };
}

const radius = (n, L) => (n.core ? 30 : 21) * L.s;

/* Curva cuadrática de cada arista (depende de las posiciones vivas) */
function curve(e) {
  const a = e.a, b = e.b;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const core = byId.eco;
  let sign = 1;
  if (!e.spoke) sign = (nx * (mx - core.x) + ny * (my - core.y)) >= 0 ? 1 : -1;
  const k = e.spoke ? 0.07 : 0.2;
  return { ax: a.x, ay: a.y, bx: b.x, by: b.y, cx: mx + nx * len * k * sign, cy: my + ny * len * k * sign, len };
}

function bez(c, t, from) {
  if (from === "b") t = 1 - t;
  const u = 1 - t;
  return [u * u * c.ax + 2 * u * t * c.cx + t * t * c.bx, u * u * c.ay + 2 * u * t * c.cy + t * t * c.by];
}

const active = () => selected || hover;
const related = (e, id) => !id || e.a.id === id || e.b.id === id;

function frame(now) {
  const t = now / 1000;
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000);
  frame.last = now;
  const L = layout();

  // física suave de nodos
  const k = 1 - Math.exp(-dt * 7);
  NODES.forEach(n => {
    const tg = targetOf(n, L, t);
    if (!n.x && !n.y) { n.x = tg.x; n.y = tg.y; }
    n.x += (tg.x - n.x) * k; n.y += (tg.y - n.y) * k;
    n.pulse = Math.max(0, n.pulse - dt * 1.6);
  });

  // fondo
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, Math.max(L.rx, L.ry) * 1.4);
  bg.addColorStop(0, "rgba(20,40,32,.55)"); bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "lighter";
  dust.forEach(d => {
    d.y -= d.s * dt; if (d.y < 0) d.y = 1;
    ctx.fillStyle = `rgba(160,200,190,${0.12 + 0.1 * Math.sin(t + d.p)})`;
    ctx.beginPath(); ctx.arc(d.x * W + Math.sin(t * 0.3 + d.p) * 6, d.y * H, d.r, 0, 6.283); ctx.fill();
  });

  const act = active();

  // aristas + gotas
  EDGES.forEach(e => {
    const c = curve(e);
    const rel = related(e, act);
    const g = ctx.createLinearGradient(c.ax, c.ay, c.bx, c.by);
    const base = rel ? (act ? 0.5 : 0.28) : 0.05;
    g.addColorStop(0, rgba(e.a.rgb, base)); g.addColorStop(1, rgba(e.b.rgb, base));
    ctx.strokeStyle = g; ctx.lineWidth = rel && act ? 2 : 1.2;
    ctx.beginPath(); ctx.moveTo(c.ax, c.ay); ctx.quadraticCurveTo(c.cx, c.cy, c.bx, c.by); ctx.stroke();

    const dim = rel ? 1 : 0.18;
    e.flows.forEach(f => {
      f.t += f.v * dt / c.len;
      if (f.t >= 1) { f.t -= 1; f.to.pulse = 1; }
      const dir = f.from === e.a ? "a" : "b";
      const col = f.from.rgb;
      const trail = 10, span = Math.min(0.35, 52 / c.len);
      for (let i = trail; i >= 0; i--) {
        const tt = f.t - span * i / trail;
        if (tt < 0) continue;
        const q = 1 - i / trail;
        const p = bez(c, tt, dir);
        ctx.fillStyle = rgba(col, 0.5 * q * q * dim);
        ctx.beginPath(); ctx.arc(p[0], p[1], 0.8 + 2.7 * q, 0, 6.283); ctx.fill();
      }
      const h = bez(c, f.t, dir);
      const gl = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 11);
      gl.addColorStop(0, rgba(col, 0.55 * dim)); gl.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(h[0], h[1], 11, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.9 * dim})`;
      ctx.beginPath(); ctx.arc(h[0], h[1], 2.3, 0, 6.283); ctx.fill();
    });
  });

  // nodos
  NODES.forEach(n => {
    const r = radius(n, L);
    const dimmed = act && act !== n.id && !EDGES.some(e => related(e, act) && (e.a === n || e.b === n));
    const al = dimmed ? 0.3 : 1;
    const breath = 0.5 + 0.5 * Math.sin(t * 1.6 + n.phase);
    const hr = r * (3 + 0.5 * breath + n.pulse * 0.9);
    const halo = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, hr);
    halo.addColorStop(0, rgba(n.rgb, (0.34 + 0.35 * n.pulse + 0.08 * breath) * al)); halo.addColorStop(1, rgba(n.rgb, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(n.x, n.y, hr, 0, 6.283); ctx.fill();
  });

  ctx.globalCompositeOperation = "source-over";
  NODES.forEach(n => {
    const r = radius(n, L);
    const dimmed = act && act !== n.id && !EDGES.some(e => related(e, act) && (e.a === n || e.b === n));
    const al = dimmed ? 0.35 : 1;
    ctx.fillStyle = "#04070a"; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgba(n.rgb, al); ctx.lineWidth = n.core ? 2.5 : 2;
    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.stroke();
    ctx.fillStyle = rgba(n.rgb, 0.9 * al);
    ctx.beginPath(); ctx.arc(n.x, n.y, r * (0.42 + 0.1 * n.pulse), 0, 6.283); ctx.fill();
    if (selected === n.id) {
      ctx.strokeStyle = rgba(n.rgb, 0.8); ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]); ctx.lineDashOffset = -t * 14;
      ctx.beginPath(); ctx.arc(n.x, n.y, r + 8, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.font = `${n.core ? 600 : 500} ${Math.round(12.5 * Math.max(0.92, L.s))}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillStyle = `rgba(232,237,243,${al})`;
    ctx.fillText(n.name, n.x, n.y + r + 8);
  });

  requestAnimationFrame(frame);
}

/* ---------- Interacción ---------- */

function pick(x, y) {
  const L = layout();
  let best = null, bd = 1e9;
  NODES.forEach(n => {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < radius(n, L) + 14 && d < bd) { best = n; bd = d; }
  });
  return best;
}

let drag = null;
cv.addEventListener("pointerdown", ev => {
  const n = pick(ev.clientX, ev.clientY);
  if (!n) { if (selected) select(null); return; }
  drag = { n, sx: ev.clientX, sy: ev.clientY, moved: false };
  cv.setPointerCapture(ev.pointerId);
  document.getElementById("hint").classList.add("off");
});
cv.addEventListener("pointermove", ev => {
  if (drag) {
    if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 6) drag.moved = true;
    if (drag.moved) drag.n.drag = { x: ev.clientX, y: ev.clientY };
    return;
  }
  const n = pick(ev.clientX, ev.clientY);
  hover = n ? n.id : null;
  cv.style.cursor = n ? "pointer" : "default";
});
function endDrag() {
  if (!drag) return;
  if (!drag.moved) select(selected === drag.n.id ? null : drag.n.id);
  drag.n.drag = null; drag = null;
}
cv.addEventListener("pointerup", endDrag);
cv.addEventListener("pointercancel", endDrag);
cv.addEventListener("pointerleave", () => { hover = null; });

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
  if (!id) { panel.hidden = true; return; }
  const n = byId[id];
  panel.style.setProperty("--c", rgba(n.rgb, 1));
  document.getElementById("p-title").innerHTML = `<i></i>${n.name}`;
  document.getElementById("p-desc").textContent = n.desc;
  const items = [];
  Object.keys(TEXT).forEach(k => {
    const [a, b] = k.split(">");
    if (a === id) items.push(`<li style="--c:${rgba(byId[b].rgb, 1)}"><b><span class="dir">envía a</span>${byId[b].name}</b>${TEXT[k]}</li>`);
  });
  Object.keys(TEXT).forEach(k => {
    const [a, b] = k.split(">");
    if (b === id) items.push(`<li style="--c:${rgba(byId[a].rgb, 1)}"><b><span class="dir">recibe de</span>${byId[a].name}</b>${TEXT[k]}</li>`);
  });
  document.getElementById("p-links").innerHTML = items.join("");
  panel.scrollTop = 0;
  panel.hidden = false;
}
document.getElementById("close").addEventListener("click", () => select(null));
window.addEventListener("keydown", e => { if (e.key === "Escape") select(null); });

requestAnimationFrame(frame);
