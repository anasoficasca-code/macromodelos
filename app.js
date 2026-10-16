"use strict";

/* ---------- Utilidades de gráfico ---------- */

const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function niceTicks(max, n) {
  const raw = max / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw);
  const out = [];
  for (let v = 0; v <= max + step * 1e-6; v += step) out.push(v);
  return out;
}

const fmtTick = v => String(parseFloat(v.toPrecision(3)));

function sample(f, x0, x1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    const y = f(x);
    if (isFinite(y)) pts.push([x, y]);
  }
  return pts;
}

function renderChart(svg, cfg) {
  const W = 600, H = 420, m = { l: 54, r: 18, t: 14, b: 46 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const sx = x => m.l + x / cfg.xmax * pw;
  const sy = y => m.t + ph - y / cfg.ymax * ph;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.replaceChildren();

  const clipId = "clip-" + svg.id;
  const defs = el("defs", {}, svg);
  el("rect", { x: m.l, y: m.t, width: pw, height: ph }, el("clipPath", { id: clipId }, defs));

  for (const v of niceTicks(cfg.xmax, 5)) {
    el("line", { class: "grid-l", x1: sx(v), x2: sx(v), y1: m.t, y2: m.t + ph }, svg);
    const t = el("text", { class: "tick", x: sx(v), y: m.t + ph + 16, "text-anchor": "middle" }, svg);
    t.textContent = fmtTick(v);
  }
  for (const v of niceTicks(cfg.ymax, 5)) {
    el("line", { class: "grid-l", x1: m.l, x2: m.l + pw, y1: sy(v), y2: sy(v) }, svg);
    const t = el("text", { class: "tick", x: m.l - 8, y: sy(v) + 4, "text-anchor": "end" }, svg);
    t.textContent = fmtTick(v);
  }
  el("line", { class: "ax", x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph }, svg);
  el("line", { class: "ax", x1: m.l, x2: m.l, y1: m.t, y2: m.t + ph }, svg);

  const xl = el("text", { class: "axl", x: m.l + pw / 2, y: H - 8, "text-anchor": "middle" }, svg);
  xl.textContent = cfg.xlab;
  const yl = el("text", { class: "axl", transform: `translate(14 ${m.t + ph / 2}) rotate(-90)`, "text-anchor": "middle" }, svg);
  yl.textContent = cfg.ylab;

  const g = el("g", { "clip-path": `url(#${clipId})` }, svg);
  const path = pts => pts.map((p, i) => (i ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1)).join("");
  for (const s of cfg.base) el("path", { class: "curve base", d: path(s.pts), stroke: s.color }, g);
  for (const s of cfg.series) el("path", { class: "curve", d: path(s.pts), stroke: s.color }, g);

  const inside = p => p.x >= 0 && p.x <= cfg.xmax && p.y >= 0 && p.y <= cfg.ymax;
  if (cfg.beq && inside(cfg.beq)) {
    el("circle", { cx: sx(cfg.beq.x), cy: sy(cfg.beq.y), r: 5, fill: "none", stroke: "var(--muted)", "stroke-width": 1.5 }, svg);
  }
  if (cfg.eq && inside(cfg.eq)) {
    el("line", { class: "drop", x1: sx(cfg.eq.x), x2: sx(cfg.eq.x), y1: sy(cfg.eq.y), y2: m.t + ph }, svg);
    el("line", { class: "drop", x1: m.l, x2: sx(cfg.eq.x), y1: sy(cfg.eq.y), y2: sy(cfg.eq.y) }, svg);
    el("circle", { cx: sx(cfg.eq.x), cy: sy(cfg.eq.y), r: 5, fill: "var(--text)" }, svg);
  }
}

/* ---------- Modelos ---------- */

const C1 = "var(--c1)", C2 = "var(--c2)", C3 = "var(--c3)";

const MODELS = [
  /* ===== IS-LM ===== */
  {
    id: "islm",
    name: "IS–LM",
    sub: "Economía cerrada · corto plazo · precios fijos",
    intro: "El equilibrio simultáneo del mercado de bienes (IS) y del mercado de dinero (LM) determina el producto Y y la tasa de interés i.",
    eqs: [
      "<b>IS:</b> Y = C + I + G",
      "C = c₀ + c₁(Y − T) &nbsp; I = I₀ − b·i",
      "<b>LM:</b> M/P = k·Y − h·i",
      "Y* = (h·A + b·M/P) / (b·k + h(1 − c₁))",
      "A = c₀ − c₁T + I₀ + G"
    ],
    tests: [
      "Sube G: la IS se desplaza a la derecha, suben Y e i (y la inversión cae: efecto desplazamiento).",
      "Sube M/P: la LM baja, i cae y Y aumenta.",
      "Pon h alto (LM plana): la política fiscal es más efectiva. Pon h bajo (LM empinada): la monetaria."
    ],
    params: [
      { k: "G", label: "Gasto público G", min: 100, max: 600, step: 10, v: 300 },
      { k: "T", label: "Impuestos T", min: 100, max: 500, step: 10, v: 250 },
      { k: "m", label: "Oferta real de dinero M/P", min: 100, max: 350, step: 5, v: 200 },
      { k: "c1", label: "Propensión marginal a consumir c₁", min: 0.3, max: 0.9, step: 0.01, v: 0.6, d: 2 },
      { k: "b", label: "Sensibilidad inversión–tasa b", min: 10, max: 80, step: 1, v: 40 },
      { k: "h", label: "Sensibilidad demanda dinero–tasa h", min: 20, max: 100, step: 1, v: 50 },
      { k: "kk", label: "Sensibilidad demanda dinero–ingreso k", min: 0.2, max: 1, step: 0.01, v: 0.5, d: 2 }
    ],
    solve(p) {
      const c0 = 200, I0 = 300;
      const A = c0 - p.c1 * p.T + I0 + p.G;
      const Y = (p.h * A + p.b * p.m) / (p.b * p.kk + p.h * (1 - p.c1));
      const i = (p.kk * Y - p.m) / p.h;
      return { A, Y, i, C: c0 + p.c1 * (Y - p.T), I: I0 - p.b * i };
    },
    chart(p) {
      const s = this.solve(p), X = 1800;
      const IS = y => (s.A - (1 - p.c1) * y) / p.b;
      const LM = y => (p.kk * y - p.m) / p.h;
      return {
        xmax: X, ymax: 20, xlab: "Producto Y", ylab: "Tasa de interés i (%)",
        series: [
          { name: "IS", color: C1, pts: [[0, IS(0)], [X, IS(X)]] },
          { name: "LM", color: C2, pts: [[0, LM(0)], [X, LM(X)]] }
        ],
        eq: { x: s.Y, y: s.i }
      };
    },
    outputs(p) {
      const s = this.solve(p);
      return [
        ["Producto Y*", s.Y, 1], ["Tasa de interés i* (%)", s.i, 2],
        ["Consumo C", s.C, 1], ["Inversión I", s.I, 1]
      ];
    }
  },

  /* ===== OA-DA ===== */
  {
    id: "oada",
    name: "OA–DA",
    sub: "Demanda y oferta agregadas · corto y largo plazo",
    intro: "La demanda agregada decrece con el nivel de precios (efecto saldos reales). La oferta de corto plazo es creciente por precios esperados rígidos; la de largo plazo es vertical en el producto natural.",
    eqs: [
      "<b>DA:</b> Y = 2G + 2·M/P",
      "<b>OACP:</b> P = Pᵉ + φ(Y − Yₙ)",
      "<b>OALP:</b> Y = Yₙ",
      "P<sub>LP</sub> = 2M / (Yₙ − 2G) &nbsp; (cuando P = Pᵉ)"
    ],
    tests: [
      "Sube M: la DA se desplaza a la derecha; en el corto plazo suben Y y P.",
      "Con Yₙ fijo, compara el P de largo plazo: Y vuelve a Yₙ y solo cambian los precios (neutralidad del dinero).",
      "Sube Pᵉ: la OACP se desplaza hacia arriba (estanflación de corto plazo)."
    ],
    params: [
      { k: "G", label: "Gasto público G", min: 100, max: 300, step: 5, v: 200 },
      { k: "M", label: "Oferta monetaria nominal M", min: 150, max: 450, step: 5, v: 300 },
      { k: "Yn", label: "Producto natural Yₙ", min: 800, max: 1200, step: 10, v: 1000 },
      { k: "Pe", label: "Precio esperado Pᵉ", min: 0.6, max: 1.6, step: 0.01, v: 1, d: 2 },
      { k: "phi", label: "Pendiente OACP φ", min: 0.0005, max: 0.004, step: 0.0001, v: 0.002, d: 4 }
    ],
    solve(p) {
      const Yd = P => 2 * p.G + 2 * p.M / P;
      const Ys = P => p.Yn + (P - p.Pe) / p.phi;
      let lo = 0.01, hi = 10;
      for (let n = 0; n < 80; n++) {
        const mid = (lo + hi) / 2;
        if (Yd(mid) - Ys(mid) > 0) lo = mid; else hi = mid;
      }
      const P = (lo + hi) / 2;
      return { P, Y: Yd(P), PLP: 2 * p.M / (p.Yn - 2 * p.G) };
    },
    chart(p) {
      const s = this.solve(p), X = 1600, Y = 3;
      const ad = sample(y => y > 2 * p.G + 1 ? 2 * p.M / (y - 2 * p.G) : NaN, 0, X, 160);
      return {
        xmax: X, ymax: Y, xlab: "Producto Y", ylab: "Nivel de precios P",
        series: [
          { name: "DA", color: C1, pts: ad },
          { name: "OA corto plazo", color: C2, pts: [[0, p.Pe - p.phi * p.Yn], [X, p.Pe + p.phi * (X - p.Yn)]] },
          { name: "OA largo plazo", color: C3, pts: [[p.Yn, 0], [p.Yn, Y]] }
        ],
        eq: { x: s.Y, y: s.P }
      };
    },
    outputs(p) {
      const s = this.solve(p);
      return [
        ["Producto Y", s.Y, 1], ["Nivel de precios P", s.P, 3],
        ["Brecha Y − Yₙ", s.Y - p.Yn, 1], ["Precio de largo plazo", s.PLP, 3]
      ];
    }
  },

  /* ===== Solow ===== */
  {
    id: "solow",
    name: "Solow",
    sub: "Crecimiento económico · estado estacionario",
    intro: "El capital por trabajador se acumula con el ahorro y se erosiona por depreciación y crecimiento de la población. En el estado estacionario la inversión iguala la inversión de reposición.",
    eqs: [
      "y = f(k) = k<sup>α</sup>",
      "Δk = s·k<sup>α</sup> − (n + δ)k",
      "k* = ( s / (n + δ) )<sup>1/(1−α)</sup>",
      "c* = (1 − s)·y* &nbsp; &nbsp; Regla de oro: s = α"
    ],
    tests: [
      "Sube s: aumenta k* e y*. El consumo c* sube hasta s = α y luego cae (regla de oro).",
      "Sube n o δ: la recta de reposición gira hacia arriba y baja k*.",
      "Si k está por debajo de k*, la economía acumula capital; si está por encima, lo decumula."
    ],
    params: [
      { k: "s", label: "Tasa de ahorro s", min: 0.05, max: 0.6, step: 0.01, v: 0.3, d: 2 },
      { k: "n", label: "Crecimiento poblacional n", min: 0, max: 0.04, step: 0.001, v: 0.01, d: 3 },
      { k: "dl", label: "Depreciación δ", min: 0.02, max: 0.1, step: 0.005, v: 0.05, d: 3 },
      { k: "a", label: "Participación del capital α", min: 0.2, max: 0.5, step: 0.01, v: 0.33, d: 2 }
    ],
    solve(p) {
      const k = Math.pow(p.s / (p.n + p.dl), 1 / (1 - p.a));
      const y = Math.pow(k, p.a);
      return { k, y, c: (1 - p.s) * y, inv: p.s * y };
    },
    chart(p, b) {
      const s = this.solve(p), sb = this.solve(b);
      const X = Math.max(5, Math.ceil(1.6 * Math.max(s.k, sb.k)));
      const Y = Math.max(Math.pow(X, p.a), Math.pow(X, b.a)) * 1.05;
      const f = q => ({
        out: sample(k => Math.pow(k, q.a), 0, X, 120),
        sav: sample(k => q.s * Math.pow(k, q.a), 0, X, 120),
        dep: [[0, 0], [X, (q.n + q.dl) * X]]
      });
      const c = f(p);
      return {
        xmax: X, ymax: Y, xlab: "Capital por trabajador k", ylab: "Producto e inversión por trabajador",
        series: [
          { name: "Producto f(k)", color: C3, pts: c.out },
          { name: "Ahorro s·f(k)", color: C1, pts: c.sav },
          { name: "Reposición (n+δ)k", color: C2, pts: c.dep }
        ],
        eq: { x: s.k, y: s.inv }
      };
    },
    baseOf(b) { return this.chart(b, b).series; },
    outputs(p) {
      const s = this.solve(p);
      return [
        ["Capital k*", s.k, 2], ["Producto y*", s.y, 3],
        ["Consumo c*", s.c, 3], ["Ahorro/inversión s·y*", s.inv, 3]
      ];
    }
  },

  /* ===== Mundell-Fleming ===== */
  {
    id: "mf",
    name: "Mundell–Fleming",
    sub: "Economía abierta pequeña · movilidad perfecta de capitales",
    intro: "Con movilidad perfecta de capitales la tasa interna iguala la mundial (r*). Los efectos de las políticas dependen del régimen cambiario.",
    eqs: [
      "<b>IS*:</b> Y = C + I + G + NX(e)",
      "NX = nx₀ − x·e &nbsp; (e: tipo de cambio)",
      "<b>LM*:</b> M/P = k·Y − h·r*",
      "Flexible: Y* = (M/P + h·r*)/k &nbsp; e* desde IS*",
      "Fijo (e = ē): Y* desde IS*; M/P se ajusta"
    ],
    tests: [
      "Régimen flexible + sube G: Y no cambia; e baja (apreciación) y desplaza a las exportaciones netas.",
      "Régimen flexible + sube M/P: Y aumenta y e sube (depreciación). La política monetaria es potente.",
      "Régimen fijo + sube G: Y aumenta (la fiscal es potente); la monetaria no tiene efecto porque M se ajusta."
    ],
    params: [
      { k: "regime", label: "Régimen cambiario", type: "select", opts: [["flex", "Tipo de cambio flexible"], ["fijo", "Tipo de cambio fijo"]], v: "flex" },
      { k: "G", label: "Gasto público G", min: 100, max: 500, step: 10, v: 300 },
      { k: "m", label: "Oferta real de dinero M/P", min: 150, max: 400, step: 5, v: 250, show: p => p.regime === "flex" },
      { k: "r", label: "Tasa de interés mundial r* (%)", min: 2, max: 10, step: 0.25, v: 5, d: 2 },
      { k: "x", label: "Sensibilidad de NX al tipo de cambio x", min: 200, max: 600, step: 10, v: 350 },
      { k: "eb", label: "Tipo de cambio fijo ē", min: 0.6, max: 1.6, step: 0.01, v: 1, d: 2, show: p => p.regime === "fijo" }
    ],
    solve(p) {
      const c0 = 200, c1 = 0.6, T = 250, I0 = 300, b = 40, nx0 = 300, k = 0.5, h = 50;
      const A = c0 - c1 * T + I0 + p.G - b * p.r + nx0;
      let Y, e, M;
      if (p.regime === "flex") {
        Y = (p.m + h * p.r) / k;
        e = (A - (1 - c1) * Y) / p.x;
        M = p.m;
      } else {
        e = p.eb;
        Y = (A - p.x * e) / (1 - c1);
        M = k * Y - h * p.r;
      }
      return { A, Y, e, M, NX: nx0 - p.x * e, c1 };
    },
    chart(p) {
      const s = this.solve(p), X = 1800, E = 2.2;
      const isE = y => (s.A - (1 - s.c1) * y) / p.x;
      const series = [
        { name: "IS*", color: C1, pts: [[0, isE(0)], [X, isE(X)]] },
        { name: "LM*", color: C2, pts: [[s.Y, 0], [s.Y, E]] }
      ];
      if (p.regime === "fijo") series.push({ name: "Tipo de cambio fijo ē", color: C3, pts: [[0, s.e], [X, s.e]] });
      return { xmax: X, ymax: E, xlab: "Producto Y", ylab: "Tipo de cambio e", series, eq: { x: s.Y, y: s.e } };
    },
    outputs(p) {
      const s = this.solve(p);
      return [
        ["Producto Y*", s.Y, 1], ["Tipo de cambio e*", s.e, 3],
        ["Exportaciones netas NX", s.NX, 1], ["Oferta real de dinero M/P", s.M, 1]
      ];
    }
  }
];

/* ---------- Interfaz ---------- */

const tablist = document.getElementById("tablist");
const main = document.getElementById("main");

function fmt(v, d) {
  return v.toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function build(model) {
  const sec = document.createElement("section");
  sec.className = "model";
  sec.id = "panel-" + model.id;
  sec.setAttribute("role", "tabpanel");
  sec.setAttribute("aria-labelledby", "tab-" + model.id);
  sec.hidden = true;
  sec.innerHTML = `
    <h2>${model.name}</h2>
    <p class="sub">${model.sub}</p>
    <div class="grid">
      <div class="col-a">
        <div class="card">
          <svg class="chart" id="chart-${model.id}" role="img" aria-label="Gráfico del modelo ${model.name}"></svg>
          <ul class="legend"></ul>
        </div>
        <div class="card"><h3>Resultados</h3><table class="out"></table></div>
      </div>
      <div class="col-b">
        <div class="card"><h3>Parámetros</h3><div class="controls"></div><button type="button" class="reset">Restablecer valores</button></div>
        <div class="card"><h3>Modelo</h3><p>${model.intro}</p><ul class="eqs">${model.eqs.map(e => `<li>${e}</li>`).join("")}</ul></div>
        <div class="card"><h3>Prueba esto</h3><ul class="tests">${model.tests.map(t => `<li>${t}</li>`).join("")}</ul></div>
      </div>
    </div>`;
  main.appendChild(sec);

  const base = {}, state = {};
  model.params.forEach(q => { base[q.k] = state[q.k] = q.v; });
  const controls = sec.querySelector(".controls");
  const ctl = {};

  model.params.forEach(q => {
    const wrap = document.createElement("div");
    wrap.className = "ctl";
    const id = `${model.id}-${q.k}`;
    if (q.type === "select") {
      wrap.innerHTML = `<label for="${id}">${q.label}</label><select id="${id}">${q.opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`;
      wrap.querySelector("select").addEventListener("change", e => { state[q.k] = e.target.value; refresh(); });
    } else {
      wrap.innerHTML = `<label for="${id}"><span>${q.label}</span><output></output></label><input type="range" id="${id}" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.v}">`;
      wrap.querySelector("input").addEventListener("input", e => { state[q.k] = +e.target.value; refresh(); });
    }
    controls.appendChild(wrap);
    ctl[q.k] = wrap;
  });

  function refresh() {
    model.params.forEach(q => {
      const w = ctl[q.k];
      w.hidden = q.show ? !q.show(state) : false;
      if (q.type !== "select") w.querySelector("output").textContent = fmt(state[q.k], q.d || 0);
    });

    const cur = model.chart(state, base);
    const bs = model.chart(base, base);
    renderChart(sec.querySelector("svg"), {
      ...cur, base: bs.series, beq: bs.eq
    });
    sec.querySelector(".legend").innerHTML = cur.series
      .map(s => `<li><i style="background:${s.color}"></i>${s.name}</li>`).join("") +
      `<li><i style="background:none;border-top:2px dashed var(--muted)"></i>Equilibrio base</li>`;

    const o = model.outputs(state), ob = model.outputs(base);
    sec.querySelector(".out").innerHTML = o.map((r, i) => {
      const dv = r[1] - ob[i][1], d = r[2];
      const small = Math.abs(dv) < Math.pow(10, -d) / 2;
      const cls = small ? "" : dv > 0 ? "up" : "dn";
      const txt = small ? "—" : (dv > 0 ? "▲ " : "▼ ") + fmt(Math.abs(dv), d);
      return `<tr><th scope="row">${r[0]}</th><td>${fmt(r[1], d)}</td><td class="d ${cls}">${txt}</td></tr>`;
    }).join("");
  }

  sec.querySelector(".reset").addEventListener("click", () => {
    model.params.forEach(q => {
      state[q.k] = q.v;
      const inp = ctl[q.k].querySelector("input, select");
      inp.value = q.v;
    });
    refresh();
  });

  refresh();
}

function show(id) {
  MODELS.forEach(m => {
    const on = m.id === id;
    document.getElementById("panel-" + m.id).hidden = !on;
    const t = document.getElementById("tab-" + m.id);
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
    if (on) t.scrollIntoView({ block: "nearest", inline: "center" });
  });
  history.replaceState(null, "", "#" + id);
}

MODELS.forEach((m, idx) => {
  const t = document.createElement("button");
  t.className = "tab";
  t.id = "tab-" + m.id;
  t.type = "button";
  t.setAttribute("role", "tab");
  t.setAttribute("aria-controls", "panel-" + m.id);
  t.textContent = m.name;
  t.addEventListener("click", () => show(m.id));
  t.addEventListener("keydown", e => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const next = MODELS[(idx + d + MODELS.length) % MODELS.length].id;
    show(next);
    document.getElementById("tab-" + next).focus();
  });
  tablist.appendChild(t);
  build(m);
});

const start = location.hash.slice(1);
show(MODELS.some(m => m.id === start) ? start : MODELS[0].id);
