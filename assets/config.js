/* Ajustes de la web de APEL. Es lo único que hay que editar después de instalar el Apps Script. */
window.APEL = {
  // Pega aquí la URL de la app web del Apps Script (termina en /exec). Vacío = modo demostración.
  API_URL: '',
  // WhatsApp de APEL con código de país, solo números (ej. 584141234567). Vacío = no se muestra el botón.
  WHATSAPP: '',
  EMAIL: '',
  INSTAGRAM: '',
  // PayPal: el Client ID es público (el Secret va SOLO en el Apps Script). Vacío = no se muestra PayPal.
  PAYPAL_CLIENT_ID: '',
  // Binance Pay automático activado en el Apps Script (true/false).
  BINANCE_PAY: false,
  // Datos que ve el alumno para el pago manual. Vacío = «te enviamos los datos por WhatsApp».
  PAGO_DATOS: {
    'Zelle': '',
    'Binance (envío directo)': '',
    'Pago móvil': '',
    'Wise': '',
    'Zinli': '',
    'Transferencia internacional': '',
    'Efectivo USD': '',
    'PayPal (envío directo)': ''
  },
  // Precios de las clases 1 a 1 por grupo (respaldo cuando la web no puede consultar al servidor; el que cobra es la hoja Productos)
  PRICES: { pronto: 90, normal: 100, prontoDay: 5, multiDiscount: 12, desde: 54,
    grupos: { 1: { pronto: 90, normal: 100 }, 2: { pronto: 72, normal: 80 }, 3: { pronto: 54, normal: 60 } } },
  PAYMENTS: ['Zelle', 'PayPal', 'Binance / USDT', 'Wise', 'Zinli', 'Transferencia internacional', 'Pago móvil (Venezuela)'],
  SCHOOLS: {
    A: { name: 'Academy', what: 'Carrera y negocio: derechos, regalías, marca personal y cómo vivir de la música.', color: 'var(--sA)' },
    P: { name: 'Production', what: 'Crear música: beats, armonía, grabación, mezcla y tu primera canción terminada.', color: 'var(--sP)' },
    E: { name: 'Engineering', what: 'Grabar, mezclar y masterizar con criterio profesional, para cualquier plataforma.', color: 'var(--sE)' },
    L: { name: 'Live', what: 'Sonido en vivo: consola digital, microfonía, monitores y shows reales.', color: 'var(--sL)' }
  }
};
window.APEL.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
window.APEL.BASE = new URL('.', document.currentScript ? document.currentScript.src : location.href).href;
window.APEL.programs = () => fetch(window.APEL.BASE + 'programs.json').then(r => r.json()).then(d => d.programs);

/* ---------- Conexión segura con el servidor (Apps Script) ---------- */
(function (A) {
  const K = 'apel-sesion';
  A.sesion = {
    get() { try { const s = JSON.parse(localStorage.getItem(K) || 'null'); return s && s.token && new Date(s.vence) > new Date() ? s : null; } catch (e) { return null; } },
    set(s) { try { s ? localStorage.setItem(K, JSON.stringify(s)) : localStorage.removeItem(K); } catch (e) {} }
  };
  // Todo va por POST con el token en el cuerpo (nunca en la URL).
  A.api = async (action, data) => {
    if (!A.API_URL) return { ok: false, error: 'La cuenta aún no está conectada.', sinServidor: true };
    const s = A.sesion.get();
    const body = JSON.stringify(Object.assign({ action }, data || {}, s ? { token: s.token } : {}));
    let r;
    try { r = await fetch(A.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' }); }
    catch (e) { return { ok: false, error: 'No pudimos conectar. Revisa tu internet e inténtalo de nuevo.' }; }
    let j; try { j = await r.json(); } catch (e) { return { ok: false, error: 'Respuesta inesperada del servidor.' }; }
    if (j && j.sesion === false) A.sesion.set(null);
    return j;
  };
  A.usd = n => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0 });
  A.fecha = (iso, conHora) => { const d = new Date(iso); return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) + (conHora ? ' · ' + d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' }) : ''); };
  A.dispositivo = () => { const u = navigator.userAgent; const so = /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /CrOS/.test(u) ? 'Chromebook' : /Linux/.test(u) ? 'Linux' : 'otro equipo'; const nav = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Navegador'; return nav + ' en ' + so; };
  // País probable según la zona horaria del navegador (solo para mostrar precios; el que vale es el que el alumno confirma)
  A.paisProbable = () => {
    try { const s = localStorage.getItem('apel-pais'); if (s) return s; } catch (e) {}
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    const m = { 'America/Caracas': 'VE', 'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Guayaquil': 'EC', 'America/Panama': 'PA', 'America/Santo_Domingo': 'DO',
      'America/Santiago': 'CL', 'America/Montevideo': 'UY', 'America/Costa_Rica': 'CR', 'America/La_Paz': 'BO', 'America/Guatemala': 'GT', 'Europe/Madrid': 'ES' };
    if (m[tz]) return m[tz];
    if (/^America\/Argentina/.test(tz)) return 'AR';
    if (/^America\/(Mexico_City|Monterrey|Merida|Cancun|Tijuana|Chihuahua|Hermosillo|Mazatlan|Bahia_Banderas|Matamoros|Ojinaga)/.test(tz)) return 'MX';
    if (/^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Manaus|Belem|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Maceio|Araguaina|Santarem|Noronha)/.test(tz)) return 'BR';
    if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise)/.test(tz) || tz === 'Pacific/Honolulu') return 'US';
    return 'OT';
  };
  A.guardarPais = c => { try { localStorage.setItem('apel-pais', c); } catch (e) {} };
  A.TIPOS = { clase: 'Clases 1 a 1', vod: 'Programa en video', suscripcion: 'Suscripción', live: 'Clase en vivo' };
})(window.APEL);

/* ---------- Identidad viva: los títulos con data-fader respiran en ancho, como un fader ---------- */
(function () {
  let calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (calm || !window.requestAnimationFrame) return;
  const t0 = performance.now();
  const frame = now => {
    const t = (now - t0) / 1000;
    document.querySelectorAll('[data-fader]').forEach((el, i) => {
      el.style.setProperty('--w', (106 + 12 * Math.sin(t * 0.8 + i * 1.7)).toFixed(1));
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
