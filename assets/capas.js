/* APEL · Capas
   Capa 0, «líquido»: debajo de todo corre un fondo vivo con los colores de las escuelas
   (lima Production, violeta Engineering, naranja Live, crema Academy) que se mezclan como tinta en agua,
   y encima una onda de audio, como la pantalla de un DAW. Sobre él flotan las láminas de vidrio (apel.css).
   - El mouse empuja la tinta y pulsa la onda como una cuerda.
   - En la portada, la sección de escuelas tiñe el líquido con el color de la escuela que se ve (APELCapas.tint).
   - Con el beat sonando, la onda late con el bombo (APELCapas.level).
   - Si la persona pidió reducir el movimiento, se dibuja un solo cuadro quieto. */
(function () {
  if (window.APELCapas) return;
  const API = window.APELCapas = { tint() {}, level() {} };
  const root = document.documentElement;
  let calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  // equipos con poca memoria: el fondo se dibuja una sola vez y queda quieto
  if ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) calm = true;

  const box = document.createElement('div');
  box.className = 'liquid'; box.setAttribute('aria-hidden', 'true');
  const ink = document.createElement('canvas'); ink.className = 'l-ink';     // manchas de color (baja resolución + desenfoque)
  const wav = document.createElement('canvas'); wav.className = 'l-wave';    // onda de audio (nítida)
  box.append(ink, wav);
  const mount = () => { document.body.prepend(box); root.classList.add('capas'); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  /* la portada se queda quieta detrás y se apaga mientras las láminas suben a taparla */
  let coverQ = false;
  function cover() {
    coverQ = false;
    const h = document.querySelector('.hero'); if (!h) return;
    const H = h.offsetHeight || 1, k = Math.min(1, Math.max(0, (scrollY - H * .2) / (H * .7)));
    h.style.setProperty('--cover', k.toFixed(3)); h.classList.toggle('gone', k > .98);
  }
  addEventListener('scroll', () => { if (!coverQ) { coverQ = true; requestAnimationFrame(cover); } }, { passive: true });
  addEventListener('load', cover); document.addEventListener('DOMContentLoaded', cover);

  const ci = ink.getContext('2d'), cw = wav.getContext('2d');
  if (!ci || !cw) return;
  const SC = 1 / 8;                       // la tinta se pinta a 1/8 y el navegador la estira: sale líquida y cuesta poco
  let W = 0, H = 0, dpr = 1, small = false;
  function size() {
    W = innerWidth; H = innerHeight; small = W < 760;
    dpr = 1;   // la onda se dibuja a 1x: en pantallas Retina a 2x costaba 4 veces más y se notaba en la fluidez
    ink.width = Math.max(8, Math.round(W * SC)); ink.height = Math.max(8, Math.round(H * SC));
    wav.width = Math.round(W * dpr); wav.height = Math.round(H * dpr);
    cw.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', () => { size(); if (calm) draw(performance.now()); });

  const dark = () => {
    const t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  };
  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const C = { lime: hex('#C8FF2E'), violet: hex('#8C7BFF'), orange: hex('#FF9F1C'), cream: hex('#F2EBDD') };
  // cada mancha recorre su propia órbita (curvas de Lissajous), lenta, como tinta que se asienta
  const blobs = [
    { c: C.lime,   r: .62, ax: .30, ay: .22, fx: .050, fy: .070, px: .20, py: .25, ph: 0 },
    { c: C.violet, r: .50, ax: .26, ay: .30, fx: .041, fy: .033, px: .78, py: .30, ph: 1.7 },
    { c: C.orange, r: .44, ax: .24, ay: .20, fx: .036, fy: .055, px: .65, py: .82, ph: 3.1 },
    { c: C.violet, r: .40, ax: .20, ay: .26, fx: .060, fy: .044, px: .15, py: .80, ph: 4.4 },
  ];
  let tintC = null, tintK = 0, tintT = 0;          // color de la escuela que se ve en la portada
  API.tint = color => { if (!color) { tintT = 0; return; } const v = String(color).trim(); if (/^#[0-9a-f]{3,6}$/i.test(v)) { tintC = hex(v); tintT = 1; } };

  let mx = -1e4, my = 0, tmx = -1e4, tmy = 0, pluck = 0, kick = 0, beat = 0;
  API.level = (k, s) => { beat = Math.max(beat, k || 0, (s || 0) * .6); };
  addEventListener('pointermove', e => { tmx = e.clientX; tmy = e.clientY; if (mx < -1e3) { mx = tmx; my = tmy; } pluck = Math.min(1, pluck + Math.hypot(e.movementX || 0, e.movementY || 0) / 140); }, { passive: true });
  addEventListener('pointerdown', e => { tmx = mx = e.clientX; tmy = my = e.clientY; pluck = 1; kick = 1; }, { passive: true });

  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  const BEAT = 60 / 96;   // el mismo tempo del dembow de la portada
  const lines = [         // frecuencia, amplitud, grosor, opacidad, fase
    { f: 1.0, a: 1.0, w: 1.6, o: .55, p: 0 }, { f: 1.7, a: .6, w: 1.1, o: .32, p: 1.3 },
    { f: .6, a: .8, w: 1, o: .24, p: 2.1 }, { f: 2.6, a: .36, w: .8, o: .2, p: 4.2 }];

  const t0 = performance.now();
  let frameN = 0, Dc = null, Dt = 0;
  function draw(now) {
    const t = calm ? 7 : (now - t0) / 1000;
    if (!Dc || now - Dt > 1000) { Dc = { v: dark() }; Dt = now; }   // el tema se consulta una vez por segundo, no en cada cuadro
    const D = Dc.v;
    mx += (tmx - mx) * .1; my += (tmy - my) * .1; pluck *= .965; kick *= .92; beat *= .9;
    tintK += (tintT - tintK) * .04;
    // la tinta se mueve lento: se repinta un cuadro sí y uno no; la onda, en todos
    if (calm || (frameN++ & 1) === 0) inkFrame(t, D);
    waveFrame(t, D);
  }
  function inkFrame(t, D) {
    const iw = ink.width, ih = ink.height, base = Math.max(iw, ih);
    ci.globalCompositeOperation = 'source-over';
    ci.fillStyle = D ? '#0E0F0C' : '#ECEEE4'; ci.fillRect(0, 0, iw, ih);
    ci.globalCompositeOperation = D ? 'screen' : 'multiply';
    const pull = mx > -1e3 ? 1 : 0;
    blobs.forEach((b, i) => {
      let x = (b.px + b.ax * Math.sin(t * b.fx * 2 * Math.PI / 6 + b.ph)) * iw;
      let y = (b.py + b.ay * Math.cos(t * b.fy * 2 * Math.PI / 6 + b.ph * 1.3)) * ih;
      if (pull) { const k = .08 * (i % 2 ? 1 : -.6); x += (mx * SC - x) * k; y += (my * SC - y) * k; }
      const col = tintC ? mix(b.c, tintC, tintK * (i ? .85 : 1)) : b.c;
      const r = b.r * base * (1 + beat * .06);
      const g = ci.createRadialGradient(x, y, 0, x, y, r);
      const a = D ? .5 : .6;
      g.addColorStop(0, rgba(col, a)); g.addColorStop(.55, rgba(col, a * .45)); g.addColorStop(1, rgba(col, 0));
      ci.fillStyle = g; ci.beginPath(); ci.arc(x, y, r, 0, Math.PI * 2); ci.fill();
    });

  }
  function waveFrame(t, D) {
    // onda de audio: respira al tempo y se pulsa con el mouse
    cw.clearRect(0, 0, W, H);
    const bt = (t % BEAT) / BEAT, env = .45 + .55 * (Math.exp(-bt * 6) * .5 + .5) * (.7 + .3 * Math.sin(t * .21));
    const cy = H * (small ? .72 : .6) + Math.sin(scrollY / Math.max(H, 1) * 1.2) * H * .05;
    const A = Math.min(H * .14, 150) * (env + kick * .5 + beat * .8);
    const stroke = D ? [200, 255, 46] : [22, 21, 15], step = small ? 6 : 4;
    cw.lineCap = 'round'; cw.lineJoin = 'round';
    for (let l = lines.length - 1; l >= 0; l--) {
      const L = lines[l]; cw.beginPath();
      for (let x = 0; x <= W; x += step) {
        const u = x / W, edge = Math.sin(Math.PI * u) * .85 + .15;
        let y = Math.sin(u * Math.PI * 6 * L.f - t * 1.6 * L.f + L.p) * .55 + Math.sin(u * Math.PI * 14.6 * L.f + t * 2.3 + L.p * 2) * .28 + Math.sin(u * Math.PI * 30 * L.f - t * 3.1) * .12 * (.6 + kick + beat);
        const d = x - mx, g = Math.exp(-d * d / 18000);
        y += g * ((my - cy) / Math.max(A, 1)) * Math.min(1, pluck) * (.35 + .5 * Math.sin(t * 14 + L.p));
        y = cy + y * A * L.a * edge;
        x ? cw.lineTo(x, y) : cw.moveTo(x, y);
      }
      cw.strokeStyle = rgba(stroke, D ? L.o * .7 : L.o * .5); cw.lineWidth = L.w; cw.stroke();
    }
    cw.fillStyle = rgba(stroke, D ? .14 : .1); cw.fillRect(0, cy - .5, W, 1);
  }

  if (calm) { requestAnimationFrame(() => { draw(performance.now()); box.classList.add('on'); }); return; }
  let run = !document.hidden;
  document.addEventListener('visibilitychange', () => { const was = run; run = !document.hidden; if (run && !was) requestAnimationFrame(loop); });
  let first = true;
  function loop(now) {
    if (!run) return;
    draw(now);
    if (first) { first = false; box.classList.add('on'); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
