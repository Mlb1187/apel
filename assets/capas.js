/* APEL · Capas
   Capa 0, «líquido»: debajo de todo flotan manchas con los colores de las escuelas
   (lima Production, violeta Engineering, naranja Live) y una onda de audio, como la pantalla de un DAW.
   Sobre él van las láminas de vidrio (apel.css).

   Versión 2 (25 nov 2026): sin canvas ni dibujo cuadro por cuadro. Antes el fondo se repintaba
   60 veces por segundo y algunos navegadores (Brave) cerraban la pestaña por memoria gráfica.
   Ahora las manchas y la onda son dibujos fijos que solo se desplazan con animaciones CSS
   (transform), que la tarjeta gráfica mueve sin volver a pintar nada.
   - El mouse empuja suavemente la tinta.
   - En la portada, la sección de escuelas tiñe el líquido con el color de la escuela (APELCapas.tint).
   - Con el beat sonando, la onda late con el bombo (APELCapas.level).
   - Si la persona pidió reducir el movimiento, todo queda quieto. */
(function () {
  if (window.APELCapas) return;
  const API = window.APELCapas = { tint() {}, level() {} };
  const root = document.documentElement;
  let calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* la onda: cuatro trazos periódicos (se repiten exacto cada 1600 unidades) para que el desplazamiento sea infinito */
  const P = 1600, VH = 400;
  function path(ks, amp, ph) {
    let d = '';
    for (let x = 0; x <= P * 2; x += 10) {
      let y = 0;
      ks.forEach(([k, a], i) => { y += a * Math.sin(2 * Math.PI * k * x / P + ph * (i + 1)); });
      d += (x ? 'L' : 'M') + x + ' ' + (VH / 2 + y * amp).toFixed(1);
    }
    return d;
  }
  const W = [ // armónicos, amplitud, grosor, opacidad
    { ks: [[3, .55], [7, .28], [15, .12]], amp: 120, w: 1.6, o: .5 },
    { ks: [[5, .5], [11, .3]], amp: 70, w: 1.1, o: .32 },
    { ks: [[2, .6], [9, .22]], amp: 95, w: 1, o: .24 },
    { ks: [[8, .5], [19, .18]], amp: 40, w: .8, o: .2 },
  ];
  // un solo dibujo con los cuatro trazos: una sola capa que se desplaza (menos trabajo para la tarjeta gráfica)
  const svg = `<div class="l-line"><svg viewBox="0 0 ${P * 2} ${VH}" preserveAspectRatio="none">` + W.map((l, i) =>
    `<path d="${path(l.ks, l.amp, i * 1.3)}" stroke-width="${l.w}" opacity="${l.o * 2}" vector-effect="non-scaling-stroke"/>`).join('') + '</svg></div>';

  const box = document.createElement('div');
  box.className = 'liquid'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<div class="l-ink"><i></i></div>' +
    `<div class="l-wave"><div class="l-amp">${svg}<span class="l-axis"></span></div></div>`;
  const mount = () => { document.body.prepend(box); root.classList.add('capas'); requestAnimationFrame(() => box.classList.add('on')); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  const amp = () => box.querySelector('.l-amp'), ink = () => box.querySelector('.l-ink');

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

  /* tinte de la escuela: solo cambia una variable de color (las manchas se repintan una vez, no en cada cuadro) */
  API.tint = color => {
    const v = color && String(color).trim();
    if (v && /^#[0-9a-f]{3,6}$/i.test(v)) { box.style.setProperty('--tint', v); box.classList.add('tinted'); }
    else box.classList.remove('tinted');
  };

  if (calm) return;

  /* vigilante: mide 3 segundos; si el navegador no llega a ~40 cuadros por segundo, el fondo se queda quieto */
  setTimeout(() => {
    let n = 0; const t0 = performance.now();
    const tick = now => { n++; if (now - t0 < 3000) requestAnimationFrame(tick); else if (n / ((now - t0) / 1000) < 40 && !document.hidden) box.classList.add('still'); };
    requestAnimationFrame(tick);
  }, 1500);

  /* el mouse empuja la tinta: un solo transform en el contenedor, una vez por cuadro como máximo */
  let pq = false, px = 0, py = 0;
  addEventListener('pointermove', e => {
    px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5;
    if (pq) return; pq = true;
    requestAnimationFrame(() => { pq = false; const n = ink(); if (n) n.style.translate = `${(px * 4).toFixed(2)}vw ${(py * 4).toFixed(2)}vh`; });
  }, { passive: true });

  /* el bombo: la onda se estira en vertical (transform), sin redibujar */
  let lv = 0, lq = false;
  API.level = (k, s) => {
    lv = Math.max(k || 0, (s || 0) * .6);
    if (lq) return; lq = true;
    requestAnimationFrame(() => { lq = false; const a = amp(); if (a) a.style.transform = `scaleY(${(1 + lv * .7).toFixed(3)})`; });
  };
})();
