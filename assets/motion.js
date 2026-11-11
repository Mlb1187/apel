/* APEL · Motion
   Movimiento de la identidad viva, sin librerías: el ancho de la letra se mueve como un fader.
   - Títulos h1 [data-fader]: suben al entrar a la página (y al cambiar de pestaña en Mi cuenta).
   - Títulos h2: entran angostos y se abren a su ancho cuando llegan a la pantalla.
   - [data-mo]: grupos que se activan en orden al verse (rutas, pasos, códigos de programa, tarjetas).
   - Botones: se hunden al tocarlos y rebotan al soltar.
   Si la persona pidió reducir el movimiento, no se anima nada. Si algo falla, todo queda visible. */
(function () {
  const root = document.documentElement;
  let calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  const ok = !calm && 'IntersectionObserver' in window && !!Element.prototype.animate;
  const M = window.APELMotion = { on: ok, pop() {}, rise() {} };
  if (!ok) return;
  root.classList.add('mo');
  // red de seguridad: si algo no llega a activarse, se muestra igual
  const safety = setTimeout(() => document.querySelectorAll('h2,[data-mo]').forEach(e => e.classList.add('in', 'now')), 4000);

  const OUT = 'cubic-bezier(.16,1,.3,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)';

  /* Subida con máscara: el texto sale de abajo y se descubre */
  M.rise = (el, delay = 0) => {
    if (!el || !el.animate) return;
    el.animate([
      { transform: 'translateY(.5em)', clipPath: 'inset(0 -10% 100% -10%)', opacity: .001 },
      { transform: 'translateY(0)', clipPath: 'inset(-20% -10% -20% -10%)', opacity: 1 }
    ], { duration: 820, delay, easing: OUT, fill: 'backwards' });
  };
  /* Golpe corto (letra de la escuela, cambios de estado) */
  M.pop = el => {
    if (!el || !el.animate) return;
    el.animate([{ transform: 'translateY(14%) scaleY(.82)', opacity: .2 }, { transform: 'none', opacity: 1 }],
      { duration: 520, easing: SPRING });
  };

  /* Títulos de página */
  const seen = new WeakMap();
  function titles() {
    document.querySelectorAll('h1[data-fader]').forEach(h => {
      const t = h.textContent.trim();
      if (seen.get(h) === t) return; seen.set(h, t);
      M.rise(h);
      const next = h.nextElementSibling;
      if (next && /^(P|DIV)$/.test(next.tagName) && !next.querySelector('input,select,textarea')) M.rise(next, 140);
    });
  }

  /* Grupos que se activan al verse */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px', threshold: .01 });
  const watched = new WeakSet();
  function scan() {
    document.querySelectorAll('h2:not([data-mo-skip]):not(.sr),[data-mo]').forEach(el => {
      if (watched.has(el)) return; watched.add(el);
      if (el.hasAttribute('data-mo')) [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
      // lo que ya está a la vista al cargar no se esconde: se activa enseguida
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * .88 && r.bottom > 0) { el.classList.add('in', 'now'); return; }
      io.observe(el);
    });
    titles();
  }

  /* Botones: se hunden y rebotan */
  const SEL = '.btn,.chips a,.nav a';
  const press = (b, down) => b.animate(
    down ? [{ transform: 'scale(1)' }, { transform: 'scale(.94)' }] : [{ transform: 'scale(.94)' }, { transform: 'scale(1)' }],
    { duration: down ? 90 : 460, easing: down ? 'ease-out' : SPRING, fill: 'forwards' });
  addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest(SEL); if (b && !b.disabled) { b._mo = 1; press(b, true); } }, { passive: true });
  const up = e => { const b = e.target.closest && e.target.closest(SEL); if (b && b._mo) { b._mo = 0; press(b, false); } };
  ['pointerup', 'pointercancel', 'pointerout'].forEach(t => addEventListener(t, up, { passive: true }));

  function start() {
    scan();
    root.classList.add('mo-ready');
    clearTimeout(safety);
    // contenido que se pinta después (programas, tienda, Mi cuenta)
    let q = 0;
    new MutationObserver(() => { if (!q) q = requestAnimationFrame(() => { q = 0; scan(); }); })
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
