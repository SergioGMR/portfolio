# Borrador: casos de estudio de los proyectos showcase (v2)

Estado: **pendiente de tu visto bueno final**. La v2 incorpora tus respuestas y
lo que encontré al revisar el código (`wattly-web`, `precio-luz-api`, `duellum`,
`/Volumes/Develop/uploadimg`, `uploadimg-desktop`). Quedan 2 preguntas abiertas,
marcadas con ❓.

Formato de cada proyecto, igual que los casos actuales: Contexto, Mi
participación, Desarrollo, Entregables, Tareas concretas y Tecnologías.

---

## Wattly

**Contexto.** El precio regulado de la luz (PVPC) cambia cada hora en España, y
consultarlo no basta para decidir cuándo poner la lavadora o el lavavajillas.
Wattly muestra el precio hora a hora y señala las franjas más baratas para cada
electrodoméstico.

**Mi participación.** Proyecto personal desarrollado en solitario: producto,
interfaz, web y API de precios propia.

**Desarrollo.**

- La web está hecha con Astro en modo SSR y con islas de Preact, y se despliega
  en Vercel. Las páginas se cachean en la CDN 5 minutos con
  _stale-while-revalidate_.
- Los precios se obtienen en el servidor desde los datos abiertos de Red
  Eléctrica (REE). Si fallan, se recurre a una API REST propia, hecha con Hono.
- Los precios de mañana se publican hacia las 20:15. Antes de esa hora se
  muestra una previsión basada en el mercado diario de OMIE.
- La mejor franja de cada electrodoméstico se calcula con una ventana deslizante
  sobre las 24 horas.

**Entregables.**
- Una web pública en producción con los precios de hoy y de mañana (como
  previsión mientras no hay precio oficial), el mínimo y el máximo, y
  recomendaciones por electrodoméstico.
- Una API REST propia de precios, desplegada en Vercel.

**Tareas concretas.**

- Renderizado en servidor y estrategia de caché en la CDN de Vercel.
- Cadena de fuentes con respaldo: REE, después la API propia y, como último
  recurso, la previsión de OMIE.
- Algoritmo de mejor franja horaria por electrodoméstico.
- API REST con Hono y caché de respuestas.
- Pruebas unitarias, de componentes y end-to-end con Vitest y Playwright.

**Tecnologías.** Astro, Preact, TypeScript, Tailwind CSS 4, Hono, Vercel,
Vitest, Playwright.

❓ **Abierta:** la API propia obtiene los precios extrayéndolos de
tarifaluzhora.es. En el texto la describo solo como «API REST propia» de
respaldo, sin mencionar la fuente. ¿Te parece bien?

---

## TVRadar

**Contexto.** Seguir series repartidas entre varias plataformas de streaming
(qué capítulos faltan, qué se estrena y dónde ver cada una) suele acabar en
notas sueltas. TVRadar lo centraliza y permite compartir el seguimiento con la
familia.

**Mi participación.** Proyecto personal desarrollado en solitario: arquitectura,
backend, interfaz y despliegue.

**Desarrollo.**

- Laravel 13 y Livewire 4, con una arquitectura modular por dominios:
  catálogo, seguimiento, disponibilidad, hogares, salas, notificaciones e
  identidad.
- El catálogo y las recomendaciones vienen de la API de TMDB.
- Acceso sin contraseña mediante un código por email (OTP).
- Salas compartidas con invitaciones firmadas y tiempo real con Laravel Reverb.
- Notificaciones push web, colas y tareas programadas sobre Redis.

**Entregables.** Una aplicación web pública en tvradar.sgmr.es con explorador,
seguimiento, estrenos, pendientes y sesiones familiares. Se despliega con Docker
en Dokploy (FrankenPHP, PostgreSQL y Redis).

**Tareas concretas.**

- Arquitectura modular por dominios con Laravel.
- Integración con TMDB para el catálogo y las recomendaciones.
- Acceso sin contraseña con código por email y límite de intentos.
- Salas compartidas y sesiones familiares con invitaciones firmadas y tiempo
  real.
- Validación de fechas de emisión para no marcar capítulos aún no estrenados.
- Contrato de API documentado con OpenAPI.

**Tecnologías.** PHP 8.5, Laravel 13, Livewire 4, Flux, Laravel Reverb,
PostgreSQL, Redis, Tailwind CSS 4, Vite, Playwright, Docker, Dokploy.

✅ Confirmado: «Familias» es el módulo de hogares, y se puede detallar la
arquitectura.

---

## Duellum

**Contexto.** Elegir entre muchas opciones (un restaurante, un nombre, una
película) es más fácil comparándolas de dos en dos. Duellum convierte la
decisión en un cuadro eliminatorio rápido.

**Mi participación.** Proyecto personal desarrollado en solitario, de la lógica
del cuadro a la interfaz y el despliegue.

**Desarrollo.**

- React 19 y TypeScript con Vite, organizado en capas: dominio, estado,
  almacenamiento y compartir.
- La lógica del cuadro es pura: los emparejamientos, el progreso y deshacer se
  derivan del orden inicial y del historial de ganadores. Por eso, al recargar
  o deshacer se reproduce exactamente el mismo cuadro.
- El cuadro se ajusta a la siguiente potencia de dos. Las opciones sobrantes
  pasan de ronda automáticamente, y esos pases se reparten por todo el cuadro.
- Los datos se guardan solo en el navegador, con un formato versionado y
  recuperación ante datos dañados.
- Los enlaces públicos al resultado llevan una imagen para redes generada en
  Vercel Edge Functions.

**Entregables.** Una aplicación web pública para cuadros de 2 a 16 opciones,
con deshacer, la posibilidad de reanudar más tarde, una imagen del ganador para
compartir (Web Share o descarga) y un enlace público al resultado.

**Tareas concretas.**

- Lógica de cuadro eliminatorio derivada del historial, con pases automáticos
  repartidos.
- Persistencia local versionada con recuperación de errores.
- Deshacer y reanudar sin perder el estado.
- Imagen del resultado con Canvas y Web Share, con descarga como alternativa.
- Enlaces públicos firmados con imagen para redes (Vercel Edge).
- Pruebas por capas con Vitest y Testing Library.

**Tecnologías.** React 19, TypeScript, Vite, Tailwind CSS 4, Vercel Edge
Functions, @vercel/og, Vitest, Testing Library.

✅ Confirmado en el código: los pases automáticos existen y tienen test, así
que la tarjeta actual es correcta.

⚠️ **Aviso, no bloquea:** en producción, `duellum.vercel.app/r/<token>` devuelve
**500** con un token inventado, cuando debería dar 404. Puede que falte la
configuración de firma en Vercel. Comprueba que compartir un resultado real
funciona; si no, quito el enlace público del caso.

---

## Uploadimg

**Contexto.** Compartir una captura o una imagen puntual no debería obligar a
subirla a un servicio permanente. Uploadimg genera un enlace que caduca a las
24 horas.

**Mi participación.** Proyecto personal desarrollado en solitario.

**Desarrollo.**

- Astro 7 en modo servidor sobre Vercel, con las imágenes y el estado en
  Vercel Blob.
- La subida se hace en dos pasos (preparar, subir y finalizar), con un ticket
  ligado al tamaño y al tipo del archivo.
- Se aceptan JPG, PNG o WebP estático de hasta 10 MB y 16 megapíxeles. Con sharp
  la imagen se orienta, se reduce a un máximo de 1920 px y se convierte a WebP
  sin metadatos; el original se retira.
- No hay base de datos: el estado vive en un registro JSON en Vercel Blob con
  escrituras condicionales.
- Cada lectura comprueba la caducidad de 24 horas, y un cron diario protegido
  limpia lo caducado.
- Tiene cuotas contra abusos (100 imágenes y 100 MB en total, 20 subidas al día
  por cliente, identificado con un HMAC de la IP) y un sistema de reportes.

**Entregables.** Un servicio web público en uploadimg.vercel.app: arrastras,
eliges o pegas una imagen, revisas la vista previa y obtienes un enlace
temporal. Es la base de la aplicación de escritorio UploadIMG.

**Tareas concretas.**

- Subida en dos pasos con tickets firmados y Vercel Blob.
- Validación de formato, tamaño y dimensiones.
- Procesado con sharp: orientación, redimensionado y conversión a WebP.
- Caducidad comprobada en cada lectura y limpieza programada con cron.
- Cuotas por cliente y reportes de contenido.
- API que usa la aplicación de escritorio.

**Tecnologías.** Astro 7, TypeScript, Vercel, Vercel Blob, sharp, Tailwind CSS
4, node:test.

✅ Corrección a lo que recordabas: la caducidad no se comprueba en una base de
datos. Se comprueba en cada lectura contra el registro de Vercel Blob, y la
limpieza es un cron.

ℹ️ El repositorio local (`/Volumes/Develop/uploadimg`) no tiene remoto, así que
el caso enlaza solo a la demo.

---

## UploadIMG - Desktop

**Resumen de la tarjeta (ajustado).** Desde la barra de menús de macOS (Apple
Silicon), pega una imagen, revisa la vista previa y compártela con un enlace
temporal de 24 horas.

**Contexto.** Compartir una captura desde el Mac con Uploadimg obligaba a abrir
el navegador. UploadIMG Desktop lo hace desde la barra de menús.

**Mi participación.** Proyecto personal desarrollado en solitario: aplicación,
integración nativa con macOS y distribución.

**Desarrollo.**

- Aplicación Tauri 2 con el núcleo en Rust.
- Integración nativa en Swift: icono en la barra de menús, portapapeles y
  notificaciones.
- La subida usa la API de Uploadimg, con validación y caducidad de 24 horas.
- Actualizaciones automáticas firmadas con el actualizador de Tauri, y
  compilación en GitHub Actions.

**Entregables.** Una beta pública para macOS Apple Silicon (0.1.0-beta.4),
descargable como DMG desde
[GitHub Releases](https://github.com/SergioGMR/uploadimg-desktop/releases),
con actualizaciones firmadas. No lleva firma de Apple Developer ID ni
notarización.

**Tareas concretas.**

- Ciclo de vida en la barra de menús: mostrar, ocultar, pausar y salir.
- Detección opcional del portapapeles, con la preferencia guardada.
- Subida con validación y caducidad de 24 horas.
- Actualizaciones automáticas firmadas.
- Pipeline de compilación y empaquetado DMG con sumas SHA-256.

**Tecnologías.** Rust, Tauri 2, Swift, Tokio, Reqwest, GitHub Actions.

✅ Resuelto: el enlace es a GitHub Releases. Como dijiste «no sé» sobre el
resumen, lo he ajustado: «Pegar imagen» es una acción explícita de la app, así
que el texto es correcto, y he añadido «desde la barra de menús».

---

## Nota técnica para la implementación (no es contenido)

- Hoy el título SEO de todos los casos termina en «— Desarrollo con Laravel».
  Para Wattly (Astro), Duellum (React) o UploadIMG Desktop (Rust) sería falso,
  así que la implementación tendrá que generar el título a partir de la
  tecnología principal de cada proyecto.
- Al pasar a caso de estudio, cada proyecto necesita su ruta `/proyectos/<id>`,
  su par en inglés, entrada en el sitemap, `lastmod`, tarjeta social de
  1200×630 y su sitio en las preguntas frecuentes.
