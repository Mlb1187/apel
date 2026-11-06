# APEL · Web, tienda, videos y clases en vivo

Qué hay en el paquete:
- `site/` → la web, que se sube a GitHub Pages.
  - `index.html` → página principal.
  - `inscripcion.html` → formulario de inscripción.
  - `tienda.html` → productos y pago.
  - `cuenta/` → donde el alumno entra con su correo: sus cursos, la videoteca, las clases en vivo, sus pagos y para canjear códigos.
  - `assets/config.js` → los datos que tú editas.
  - `assets/programs.json` → los programas y temarios.
- `apps-script/Code.gs` → el servidor. Va dentro de tu hoja de Google, guarda todo y es el único que decide quién ve qué.

---

## Cómo funciona la seguridad

| Qué | Cómo se protege |
|---|---|
| **Entrar a la cuenta** | Sin contraseñas: el alumno escribe su correo y recibe un código de 6 dígitos que vence en 10 minutos. Tras 6 intentos fallidos se bloquea 15 minutos; se pueden pedir como máximo 5 códigos por hora. |
| **Sesión** | El navegador guarda una llave aleatoria; tu hoja solo guarda su huella (SHA-256), así que ni viendo la hoja se puede entrar. Dura 30 días. |
| **Compartir la cuenta** | **Un solo dispositivo por cuenta**: si alguien entra desde otro equipo, la sesión anterior se cierra al instante y ese equipo tiene que pedir un código nuevo, que llega al correo del dueño. El alumno ve un aviso de qué equipo se cerró. Si una cuenta entra 5 veces o más en una semana, te llega un correo «Posible cuenta compartida» con los equipos usados. Para cambiar el límite: `MAX_SESIONES` y `ALERTA_ENTRADAS_SEMANA` al inicio del script. |
| **Videos (Bunny Stream)** | Los IDs de los videos nunca llegan al navegador. El servidor revisa el acceso y entrega un enlace firmado que solo sirve por 4 horas. Bunny bloquea la reproducción fuera de tu dominio y sin firma. El correo del alumno flota sobre el video, también en pantalla completa. |
| **Clases en vivo (Meet)** | El enlace de Meet solo lo ven quienes tienen acceso, y aparece 15 minutos antes de empezar. Además, el servidor los agrega como invitados al evento de Calendar; si alguien reenvía el enlace, esa persona tiene que pedir permiso para entrar y tú decides. |
| **Pagos** | El precio lo pone el servidor, nunca la web, según el país fijado en la cuenta (sección 6b). PayPal y Binance se verifican directamente con su API: monto, moneda y orden. Una orden no se puede cobrar dos veces ni reclamarla otra cuenta. Las claves secretas están en el script, no en la web ni en la hoja. |
| **Códigos** | Formato APEL-XXXX-XXXX, aleatorios y de un solo uso, con fecha límite de canje. Tras 8 intentos fallidos se bloquea una hora. |
| **Hoja** | Privada. Los textos que llegan de la web se guardan neutralizados (no pueden ejecutar fórmulas). |

**Límite honesto:** ningún sistema impide que alguien grabe su pantalla. La marca de agua con su correo es lo que disuade, porque deja ver quién filtró el video. Para más protección, Bunny ofrece DRM (MediaCage) en su panel.

---

## 1. Bunny Stream (videos)
1. Crea una cuenta en bunny.net, entra a **Stream › Add Video Library** y sube tus videos.
2. En la librería, entra a **Security** y:
   - activa **Embed view token authentication**;
   - en **Allowed referrers / domains**, agrega tu dominio (por ejemplo `mlb1187.github.io` o `apel.academy`);
   - activa **Block direct URL file access**.
3. Copia el número de la **Video Library ID** y la **Token authentication key** de Security. Ojo: esa clave no es la API key.
4. Por cada video, agrega una fila en la hoja **Videos**:

| ID Bunny | Título | Programa | Módulo | Orden | Duración | Muestra gratis | Visible |
|---|---|---|---|---|---|---|---|
| (GUID del video en Bunny) | Tu primer beat | P101 | 2 | 1 | 24:30 | ☐ | ☑ |

«Muestra gratis» lo deja abierto para cualquier persona con cuenta, como gancho.

**Quién ve cada video:**
- quien compró el **programa en video** de ese programa;
- quien tiene la **suscripción** activa;
- el alumno de **clases 1 a 1** de ese programa, hasta el módulo que pongas en «Hasta módulo» en su fila de Accesos (vacío = todo el programa).

## 2. PayPal (cobro automático)
1. Entra a developer.paypal.com con tu cuenta PayPal Business y ve a **Apps & Credentials › Create App**.
2. Copia el **Client ID** y el **Secret**. Prueba primero en **Sandbox** y después repite con **Live**.
3. El Client ID va en `config.js` (`PAYPAL_CLIENT_ID`). El Client ID, el Secret y el modo (`sandbox` o `live`) van en el script con el menú **APEL › Configurar claves**.

## 3. Binance Pay (cobro automático en USDT)
1. Solicita la cuenta de comercio en Binance (Binance Pay Merchant) y crea las **API keys**.
2. Guarda la **API Identity Key** y la **Secret Key** con **APEL › Configurar claves**, y pon `BINANCE_PAY: true` en `config.js`.
3. El alumno paga en la página de Binance, vuelve a su cuenta y el acceso se activa. Si no vuelve, el script revisa los pagos pendientes cada 10 minutos.
4. Haz una compra de prueba de poco monto. Si Binance rechaza el pedido por la categoría del producto, cambia `goodsCategory` en `binanceCrear_` del script.

## 4. Pago manual (Zelle, pago móvil, Zinli, Wise…)
1. En `config.js`, llena `PAGO_DATOS` con tus datos de cada método. Si dejas uno vacío, la web dice «te enviamos los datos por WhatsApp».
2. El alumno paga y reporta la referencia, y te llega un correo.
3. En la hoja **Pagos**, selecciona la fila y usa **APEL › Aprobar pago seleccionado**. Se activa su acceso y le llega un correo. Si algo no cuadra, usa **Rechazar pago seleccionado**.

## 5. Instalar el servidor (una vez)
1. En tu hoja **APEL · Web**, entra a **Extensiones › Apps Script**, borra lo que hay y pega `apps-script/Code.gs`. Guarda.
2. Ejecuta **prepararHojas** y acepta los permisos. Google pide hoja, correo, Drive, Calendar y conexión externa, porque el script hace todo eso.
3. Ejecuta **APEL › Configurar claves**: la dirección de tu web (`URL_WEB`), Bunny, PayPal y Binance. Puedes dejar vacío lo que aún no uses.
4. **Implementar › Nueva implementación › App web**. Ejecutar como: **Yo**. Acceso: **Cualquier persona**. Copia la URL `/exec` y pégala en `API_URL` de `config.js`.
5. Si cambias el código más adelante: **Gestionar implementaciones › Editar › Nueva versión**. La URL no cambia.

## 6. Productos (hoja Productos)
| Columna | Para qué |
|---|---|
| ID | Código único: `CLASE-P101`, `VOD-P101`, `SUB-VOD`, `LIVE-2026-12-05`… |
| Tipo | `clase` (mensualidad 1 a 1), `vod` (programa en video), `suscripcion` (videoteca completa) o `live` (clase grupal en vivo) |
| Programa | Código del programa (P101…) para clase y vod |
| Precio USD / Precio pronto pago | Precio del **Grupo 1**. Las clases cobran el precio de pronto pago hasta el día 5 |
| Precio G2 / Pronto G2 / Precio G3 / Pronto G3 | Precio de los **Grupos 2 y 3** (al final de la hoja). Si los dejas vacíos, ese grupo paga el del Grupo 1 |
| Días de acceso | 31 para mensualidades, 365 para un programa en video, 0 = sin vencimiento |
| Fecha en vivo, Duración, Cupo, Enlace Meet, ID evento Calendar | Solo para `live` |
| Incluido en suscripción | Para `live`: si los suscriptores entran sin pagar aparte |
| Activo | Solo se vende lo que está activo y tiene precio |

**Ya vienen cargados:**
- las clases 1 a 1 de P101, P201 y L101, activas: $100 / $90 (Grupo 1), $80 / $72 (Grupo 2) y $60 / $54 (Grupo 3), regular / pronto pago;
- los programas en video ($129 / $99 / $69) y la suscripción ($19 / $15 / $12), con precio pero **inactivos** hasta que subas los videos;
- la clase en vivo de ejemplo ($15 / $12 / $9), inactiva;
- un ejemplo de clase en vivo.

**Crear una clase en vivo:**
1. Crea el evento en Google Calendar con Meet.
2. Copia el enlace de Meet y el ID del evento (en el evento: Opciones › Solución de problemas › ID del evento).
3. Llena una fila `live` con la fecha, el cupo y el precio, y márcala Activo.

El cupo se respeta en las compras y en los códigos. ¿Quieres dejar la grabación? Súbela a Bunny y agrégala en la hoja **Videos** como muestra o dentro de un programa.

## 6b. Precios por país
Los precios salen del análisis «APEL · Precios para Latinoamérica», en tres grupos según el poder adquisitivo:
- **Grupo 1:** Chile, Uruguay, Costa Rica, Panamá, EE. UU., España y cualquier país fuera de la lista.
- **Grupo 2:** México, Colombia, Ecuador, República Dominicana, Guatemala y Venezuela.
- **Grupo 3:** Perú, Bolivia, Brasil y Argentina.

**Cómo funciona:**
1. La web propone el país según la zona horaria del navegador y muestra esos precios. Sin cuenta, cualquiera puede cambiarlo para ver otros precios.
2. Antes del primer pago, el alumno confirma su país. Queda fijo en la hoja **Cuentas** y él no puede cambiarlo.
3. El servidor cobra el precio del grupo de ese país, en PayPal, Binance y pago manual.
4. **PayPal** informa el país de la cuenta que paga. Si es de un grupo más caro que el declarado, por ejemplo una cuenta PayPal de EE. UU. pagando el precio de Argentina, el pago queda **Pendiente** con el motivo en la nota y te llega un correo. Tú decides si apruebas, pides la diferencia o reembolsas.
5. En el **pago manual** ves el país y el grupo en la nota del pago. Revisa que coincidan con el método o el banco.
6. **Binance** no informa el país: se respeta el declarado.

**Excepciones:**
- Para mover un país de grupo, cambia su número en `PAISES`, al inicio del script.
- Para una persona en particular (por ejemplo, un alumno que se mudó), cambia su **País** o su **Grupo** en la hoja Cuentas: el número de la columna Grupo manda.
- Para becas o promociones, usa códigos en lugar de bajar el precio público.

## 7. Códigos de acceso
**APEL › Generar códigos de acceso…**: eliges producto, cantidad (hasta 200) y días. Los códigos quedan en la hoja **Códigos**, sirven una sola vez y se pueden canjear durante 180 días. Para anular uno, cambia su Estado a «Anulado».

Úsalos para:
- regalos y becas;
- promociones a exalumnos;
- pagos que recibes por fuera.

El alumno lo canjea en **Mi cuenta › Canjear un código**.

## 8. Otras herramientas del menú
- **Dar acceso manual…**: activa un producto a un correo sin pago, por ejemplo para el alumno de 1 a 1 que pagó en persona.
- **Cerrar todas las sesiones de un correo…**: si sospechas que una cuenta se está compartiendo.
- **Actualizar archivo para la bitácora**: rehace `apel-inscripciones.txt` para «Traer inscripciones».

## 9. Límites de Google que conviene saber
- **Correos:** con una cuenta Gmail normal, el script puede enviar unos **100 correos al día** (códigos de entrada, confirmaciones y avisos). Con Google Workspace el límite sube mucho. Si APEL crece, conviene pasar la cuenta del script a Workspace.
- **Tiempo de respuesta:** cada consulta tarda alrededor de 1 segundo porque lee la hoja. Para cientos de alumnos va bien; para miles, el siguiente paso sería una base de datos.

## 10. Lista de pruebas antes de abrir
- [ ] Entrar con tu correo y recibir el código.
- [ ] Comprar algo con PayPal en **sandbox** y ver el acceso activo.
- [ ] Reportar un pago manual, aprobarlo y recibir el correo.
- [ ] Generar un código, canjearlo y volver a canjearlo (debe decir «ya fue usado»).
- [ ] Abrir un video y comprobar que la marca de agua aparece y que el video no se reproduce en otra página.
- [ ] Entrar desde un segundo dispositivo y ver que el primero se cierra al instante.
- [ ] Pasar PayPal a `live` y hacer una compra real de poco monto.

## 11. Inscripciones y bitácora
- **Llega una inscripción:** te llega un correo, aparece en la hoja **Inscripciones** y en la bitácora entra con **Interesados › Traer inscripciones**, con la etiqueta *Web* y sin duplicados. El archivo `apel-inscripciones.txt` de tu Drive es el puente: no lo borres.
- **Programas de la web:** en la bitácora, **Temarios › Exportar para la web** y sube el `programs.json` a `site/assets/`.
