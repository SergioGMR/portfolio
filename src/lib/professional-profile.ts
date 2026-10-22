export type Locale = 'es' | 'en'

/** A localized value kept together on the record that owns it. */
export type Localized<T> = Readonly<Record<Locale, T>>

export type EmploymentType = 'freelance'
export type ExperienceStatus = 'current' | 'completed'

export interface Experience {
  readonly id: string
  readonly title: Localized<string>
  readonly company: Localized<string>
  readonly location: Localized<string>
  readonly employmentType: EmploymentType
  readonly status: ExperienceStatus
  readonly startDate: string
  readonly endDate: string | null
  readonly responsibilities: Localized<readonly string[]>
  readonly outcomes: Localized<readonly string[]>
  readonly technologies: readonly string[]
  readonly evidenceUrl?: string
}

export interface CaseStudyProject {
  readonly id: string
  readonly kind: 'case-study'
  readonly title: Localized<string>
  /** What the project is, as the SEO title states it ("Aplicación web con React"). */
  readonly titleFocus: Localized<string>
  readonly summary: Localized<string>
  readonly tasks: Localized<readonly string[]>
  readonly problem: Localized<string>
  readonly responsibility: Localized<string>
  readonly solution: Localized<string>
  readonly result: Localized<string>
  readonly technologies: readonly string[]
  readonly evidenceUrl: string
  readonly imageKey: string
  readonly experienceIds: readonly string[]
}

export type Project = CaseStudyProject

export interface Education {
  readonly id: string
  readonly qualification: Localized<string>
  readonly institution: Localized<string>
  readonly location: Localized<string>
  readonly startDate: string
  readonly endDate: string
  readonly level: string
}

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface LanguageProficiency {
  readonly id: string
  readonly name: Localized<string>
  readonly levels: {
    readonly listening: LanguageLevel
    readonly reading: LanguageLevel
    readonly writing: LanguageLevel
    readonly spokenProduction: LanguageLevel
    readonly spokenInteraction: LanguageLevel
  }
}

export interface Capability {
  readonly id: string
  readonly label: Localized<string>
  readonly summary: Localized<string>
  readonly technologies: readonly string[]
  readonly evidenceIds: readonly string[]
}

export interface ProfessionalProfile {
  readonly person: {
    readonly name: string
    readonly headline: Localized<string>
    readonly location: Localized<string>
  }
  readonly links: {
    readonly github: string
    readonly linkedin: string
    readonly twitter: string
    readonly mail: string
  }
  readonly cvUrls: Localized<string>
  readonly experiences: readonly Experience[]
  readonly projects: readonly Project[]
  readonly education: readonly Education[]
  readonly languages: readonly LanguageProficiency[]
  readonly capabilities: readonly Capability[]
}

const experiences: readonly Experience[] = [
  {
    id: 'current-project',
    title: {
      es: 'Project Manager | Tech Leader | FullStack Developer',
      en: 'Project Manager | Tech Leader | FullStack Developer',
    },
    company: { es: 'Freelance', en: 'Freelance' },
    location: { es: 'Las Palmas, España', en: 'Las Palmas, Spain' },
    employmentType: 'freelance',
    status: 'current',
    startDate: '2023-12-01',
    endDate: null,
    responsibilities: {
      es: [
        'Análisis de las necesidades del sistema',
        'Diseño de la base de datos',
        'Desarrollo del BackOffice y el sistema de backups',
        'Diseño del sistema de importación de archivos BMCAT',
        'Desarrollo del frontend',
        'Lógica de eventos y colas',
        'Desarrollo usando Laravel, Livewire y FilamentPHP',
      ],
      en: [
        'System requirements analysis',
        'Database design',
        'Development of the BackOffice and backup system',
        'Design of the BMCAT file import system',
        'Frontend development',
        'Event and queue logic',
        'Development using Laravel, Livewire, and FilamentPHP',
      ],
    },
    outcomes: {
      es: [
        'BackOffice y sistema de backups implementados',
        'Importación BMCAT, frontend y lógica de eventos y colas desarrollados',
      ],
      en: [
        'BackOffice and backup system implemented',
        'BMCAT import, frontend, and event and queue logic developed',
      ],
    },
    technologies: ['Laravel', 'Livewire', 'FilamentPHP'],
    evidenceUrl: 'https://todo-lux.com/',
  },
  {
    id: 'tecandu',
    title: { es: 'FullStack Developer', en: 'FullStack Developer' },
    company: {
      es: 'Freelance | Tecandu S.L.',
      en: 'Freelance | Tecandu S.L.',
    },
    location: { es: 'España', en: 'Spain' },
    employmentType: 'freelance',
    status: 'completed',
    startDate: '2023-10-01',
    endDate: '2024-04-23',
    responsibilities: {
      es: [
        'Adaptación de tecnologías a los nuevos tiempos',
        'Coordinación del equipo de desarrollo y del equipo DevOps',
        'Estudio y rediseño de la base de datos para transferir datos sin pérdida de información o funcionalidades',
        'Desarrollo de una nueva versión v3 de la API utilizando Laravel Sanctum',
        'Planificación de las pruebas faltantes y su implementación',
        'Desarrollo de CI/CD con GitHub Actions y Plesk',
      ],
      en: [
        'Adapting technologies to current needs',
        'Coordination of the development team and the DevOps team',
        'Study and redesign of the database to transfer data without losing information or functionality',
        'Development of a new v3 API version using Laravel Sanctum',
        'Planning and implementation of missing tests',
        'CI/CD development with GitHub Actions and Plesk',
      ],
    },
    outcomes: {
      es: [
        'API v3 desarrollada con Laravel Sanctum',
        'Pruebas pendientes planificadas e implementadas',
        'CI/CD desarrollado con GitHub Actions y Plesk',
      ],
      en: [
        'v3 API developed with Laravel Sanctum',
        'Missing tests planned and implemented',
        'CI/CD developed with GitHub Actions and Plesk',
      ],
    },
    technologies: ['Laravel', 'Laravel Sanctum', 'GitHub Actions', 'Plesk'],
  },
  {
    id: 'freelance-2020',
    title: { es: 'Fullstack Developer', en: 'Fullstack Developer' },
    company: { es: 'Freelance', en: 'Freelance' },
    location: { es: 'Las Palmas, España', en: 'Las Palmas, Spain' },
    employmentType: 'freelance',
    status: 'completed',
    startDate: '2020-06-30',
    endDate: '2020-10-10',
    responsibilities: {
      es: [
        'Desarrollo del backend de la aplicación con Laravel',
        'Desarrollo de la aplicación móvil con Quasar Framework',
        'Desarrollo de una aplicación web con Laravel y Livewire',
      ],
      en: [
        'Backend development for the application with Laravel',
        'Mobile application development with Quasar Framework',
        'Web application development with Laravel and Livewire',
      ],
    },
    outcomes: {
      es: [
        'Backend desarrollado con Laravel',
        'Aplicaciones web y móvil desarrolladas para el proyecto',
      ],
      en: [
        'Backend developed with Laravel',
        'Web and mobile applications developed for the project',
      ],
    },
    technologies: ['Laravel', 'Quasar Framework', 'Livewire'],
    evidenceUrl:
      'https://proyectolibera.org/app-basuraleza-caracterizacion-residuos',
  },
]

function getExperienceTasks(id: string): Localized<readonly string[]> {
  const experience = experiences.find((experience) => experience.id === id)
  if (!experience) throw new Error(`Missing experience: ${id}`)
  return experience.responsibilities
}

const projects: readonly Project[] = [
  {
    id: 'jauntjar',
    kind: 'case-study',
    title: { es: 'JauntJar', en: 'JauntJar' },
    titleFocus: { es: 'Desarrollo con Laravel', en: 'Laravel development' },
    summary: {
      es: 'Aplicación privada de viajes con Laravel, creada junto a mi mujer, ingeniera de datos, para planificar destinos y valorar experiencias.',
      en: 'A private Laravel travel app, built with my wife, a data engineer, to plan destinations and rate experiences.',
    },
    tasks: {
      es: [
        'Modelado de la información y gestión de destinos',
        'Interfaz para planificar y puntuar viajes',
        'Registro de lugares visitados y preparación de destinos futuros',
        'Mapas y estadísticas de viaje',
      ],
      en: [
        'Information modeling and destination management',
        'Interface for planning and rating trips',
        'Visited-place records and future destination planning',
        'Travel maps and statistics',
      ],
    },
    problem: {
      es: 'Queríamos un espacio privado para planificar viajes, guardar destinos visitados y convertir experiencias en un ranking personal.',
      en: 'We wanted a private space to plan trips, keep visited destinations, and turn experiences into a personal ranking.',
    },
    responsibility: {
      es: 'Construcción conjunta con mi mujer, ingeniera de datos, desde el modelado de la información y la gestión de destinos hasta la interfaz para planificar y puntuar viajes.',
      en: 'Built with my wife, a data engineer, from information modeling and destination management to the interface for planning and rating trips.',
    },
    solution: {
      es: 'Aplicación web privada para registrar lugares visitados, preparar destinos futuros, valorar experiencias y consultar mapas y estadísticas de viaje.',
      en: 'A private web app to record visited places, plan future destinations, rate experiences, and explore maps and travel statistics.',
    },
    result: {
      es: 'Registro de lugares visitados, planificación de destinos futuros y valoraciones, con mapas y estadísticas de nuestros viajes.',
      en: 'Visited-place records, future destination planning, and ratings, with maps and statistics for our travels.',
    },
    technologies: [
      'Laravel 12',
      'PHP 8.4',
      'Livewire',
      'FilamentPHP',
      'Tailwind CSS 4',
      'Vite',
    ],
    evidenceUrl: 'https://trips.sgmr.es/',
    imageKey: 'jauntjar',
    experienceIds: [],
  },
  {
    id: 'todo-lux',
    kind: 'case-study',
    title: { es: 'Todo-Lux', en: 'Todo-Lux' },
    titleFocus: { es: 'Desarrollo con Laravel', en: 'Laravel development' },
    summary: {
      es: 'Desarrollo con Laravel de BackOffice, importación BMCAT y backups, desde el análisis de requisitos hasta el frontend y los flujos de eventos y colas.',
      en: 'Laravel development of BackOffice, BMCAT import, and backups, from requirements analysis to the frontend and event and queue flows.',
    },
    tasks: getExperienceTasks('current-project'),
    problem: {
      es: 'El sistema necesitaba análisis de requisitos, operación interna y flujos de importación y respaldo.',
      en: 'The system needed requirements analysis, internal operations, and import and backup flows.',
    },
    responsibility: {
      es: 'Responsabilidad sobre el análisis, la base de datos, el BackOffice, backups, importación BMCAT, frontend y lógica de eventos y colas.',
      en: 'Responsibility for analysis, database design, BackOffice, backups, BMCAT import, frontend, and event and queue logic.',
    },
    solution: {
      es: 'Desarrollo con Laravel, Livewire y FilamentPHP para concentrar la operación del proyecto.',
      en: 'Development with Laravel, Livewire, and FilamentPHP to centralize project operations.',
    },
    result: {
      es: 'BackOffice y sistema de backups implementados; importación BMCAT, frontend y lógica de eventos y colas desarrollados.',
      en: 'BackOffice and backup system implemented; BMCAT import, frontend, and event and queue logic developed.',
    },
    technologies: ['Laravel', 'Livewire', 'FilamentPHP'],
    evidenceUrl: 'https://todo-lux.com/',
    imageKey: 'todo-lux',
    experienceIds: ['current-project'],
  },
  {
    id: 'basuraleza',
    kind: 'case-study',
    title: { es: 'Basuraleza', en: 'Basuraleza' },
    titleFocus: { es: 'Desarrollo con Laravel', en: 'Laravel development' },
    summary: {
      es: 'Desarrollo del backend y de las aplicaciones web y móvil para caracterizar residuos, con Laravel, Livewire y Quasar Framework.',
      en: 'Development of backend, web, and mobile applications for waste characterization with Laravel, Livewire, and Quasar Framework.',
    },
    tasks: getExperienceTasks('freelance-2020'),
    problem: {
      es: 'El proyecto necesitaba una aplicación con backend, web y móvil para la caracterización de residuos.',
      en: 'The project needed backend, web, and mobile applications for waste characterization.',
    },
    responsibility: {
      es: 'Desarrollo del backend con Laravel y de las aplicaciones web y móvil con Laravel, Livewire y Quasar Framework.',
      en: 'Development of the Laravel backend and the web and mobile applications with Laravel, Livewire, and Quasar Framework.',
    },
    solution: {
      es: 'Backend con Laravel, aplicación web con Laravel y Livewire y aplicación móvil con Quasar Framework.',
      en: 'Laravel backend, a web application with Laravel and Livewire, and a mobile application with Quasar Framework.',
    },
    result: {
      es: 'Backend desarrollado con Laravel y aplicaciones web y móvil desarrolladas para la caracterización de residuos.',
      en: 'Laravel backend and web and mobile applications developed for waste characterization.',
    },
    technologies: ['Laravel', 'Livewire', 'Quasar Framework'],
    evidenceUrl:
      'https://proyectolibera.org/app-basuraleza-caracterizacion-residuos',
    imageKey: 'basuraleza',
    experienceIds: ['freelance-2020'],
  },
  {
    id: 'wattly',
    kind: 'case-study',
    title: { es: 'Wattly', en: 'Wattly' },
    titleFocus: {
      es: 'Aplicación web con Astro',
      en: 'Astro web application',
    },
    summary: {
      es: 'Compara los precios horarios de la electricidad en España y encuentra las horas más económicas para usar tus electrodomésticos.',
      en: 'Compare hourly electricity prices in Spain and find the most economical times to use your appliances.',
    },
    tasks: {
      es: [
        'Renderizado en servidor y estrategia de caché en la CDN de Vercel',
        'Cadena de fuentes con respaldo: REE, después la API propia y, como último recurso, la previsión de OMIE',
        'Algoritmo de mejor franja horaria por electrodoméstico',
        'API REST con Hono y caché de respuestas',
        'Pruebas unitarias, de componentes y end-to-end con Vitest y Playwright',
      ],
      en: [
        'Server-side rendering and a caching strategy on the Vercel CDN',
        'Source chain with fallbacks: REE, then the project’s own API and, as a last resort, the OMIE forecast',
        'Best-time-slot algorithm for each appliance',
        'REST API with Hono and response caching',
        'Unit, component, and end-to-end tests with Vitest and Playwright',
      ],
    },
    problem: {
      es: 'El precio regulado de la luz (PVPC) cambia cada hora en España, y consultarlo no basta para decidir cuándo poner la lavadora o el lavavajillas. Wattly muestra el precio hora a hora y señala las franjas más baratas para cada electrodoméstico.',
      en: 'The regulated electricity price (PVPC) changes every hour in Spain, and checking it is not enough to decide when to run the washing machine or the dishwasher. Wattly shows the price hour by hour and highlights the cheapest time slots for each appliance.',
    },
    responsibility: {
      es: 'Proyecto personal desarrollado en solitario: producto, interfaz, web y API de precios propia.',
      en: 'Personal project built solo: product, interface, web app, and its own price API.',
    },
    solution: {
      es: 'La web está hecha con Astro en modo SSR y con islas de Preact, y se despliega en Vercel. Las páginas se cachean en la CDN 5 minutos con stale-while-revalidate. Los precios se obtienen en el servidor desde los datos abiertos de Red Eléctrica (REE). Si fallan, se recurre a una API REST propia, hecha con Hono. Los precios de mañana se publican hacia las 20:15. Antes de esa hora se muestra una previsión basada en el mercado diario de OMIE. La mejor franja de cada electrodoméstico se calcula con una ventana deslizante sobre las 24 horas.',
      en: 'The web app is built with Astro in SSR mode with Preact islands, and is deployed on Vercel. Pages are cached on the CDN for 5 minutes with stale-while-revalidate. Prices are fetched on the server from the open data of Red Eléctrica (REE). If that fails, it falls back to its own REST API, built with Hono. Tomorrow’s prices are published around 20:15. Before that time, a forecast based on the OMIE day-ahead market is shown. The best time slot for each appliance is calculated with a sliding window over the 24 hours.',
    },
    result: {
      es: 'Una web pública en producción con los precios de hoy y de mañana (como previsión mientras no hay precio oficial), el mínimo y el máximo, y recomendaciones por electrodoméstico. Una API REST propia de precios, desplegada en Vercel.',
      en: 'A public website in production with today’s and tomorrow’s prices (as a forecast while there is no official price), the minimum and the maximum, and recommendations per appliance. Its own price REST API, deployed on Vercel.',
    },
    technologies: [
      'Astro',
      'Preact',
      'TypeScript',
      'Tailwind CSS 4',
      'Hono',
      'Vercel',
      'Vitest',
      'Playwright',
    ],
    evidenceUrl: 'https://wattly-alpha.vercel.app/',
    imageKey: 'wattly',
    experienceIds: [],
  },
  {
    id: 'tvradar',
    kind: 'case-study',
    title: { es: 'TVRadar', en: 'TVRadar' },
    titleFocus: { es: 'Desarrollo con Laravel', en: 'Laravel development' },
    summary: {
      es: 'Organiza tus series, estrenos, pendientes y sesiones familiares en un solo lugar.',
      en: 'Organize your series, premieres, watchlist, and family viewing in one place.',
    },
    tasks: {
      es: [
        'Arquitectura modular por dominios con Laravel',
        'Integración con TMDB para el catálogo y las recomendaciones',
        'Acceso sin contraseña con código por email y límite de intentos',
        'Salas compartidas y sesiones familiares con invitaciones firmadas y tiempo real',
        'Validación de fechas de emisión para no marcar capítulos aún no estrenados',
        'Contrato de API documentado con OpenAPI',
      ],
      en: [
        'Domain-based modular architecture with Laravel',
        'TMDB integration for the catalog and recommendations',
        'Passwordless sign-in with an email code and an attempt limit',
        'Shared rooms and family viewing sessions with signed invitations and real-time updates',
        'Air-date validation so that episodes that have not aired yet cannot be marked',
        'API contract documented with OpenAPI',
      ],
    },
    problem: {
      es: 'Seguir series repartidas entre varias plataformas de streaming (qué capítulos faltan, qué se estrena y dónde ver cada una) suele acabar en notas sueltas. TVRadar lo centraliza y permite compartir el seguimiento con la familia.',
      en: 'Following series spread across several streaming platforms (which episodes are missing, what is premiering, and where to watch each one) often ends up as scattered notes. TVRadar centralizes it and lets you share your tracking with your family.',
    },
    responsibility: {
      es: 'Proyecto personal desarrollado en solitario: arquitectura, backend, interfaz y despliegue.',
      en: 'Personal project built solo: architecture, backend, interface, and deployment.',
    },
    solution: {
      es: 'Laravel 13 y Livewire 4, con una arquitectura modular por dominios: catálogo, seguimiento, disponibilidad, hogares, salas, notificaciones e identidad. El catálogo y las recomendaciones vienen de la API de TMDB. Acceso sin contraseña mediante un código por email (OTP). Salas compartidas con invitaciones firmadas y tiempo real con Laravel Reverb. Notificaciones push web, colas y tareas programadas sobre Redis.',
      en: 'Laravel 13 and Livewire 4, with a modular architecture organized by domains: catalog, tracking, availability, households, rooms, notifications, and identity. The catalog and recommendations come from the TMDB API. Passwordless sign-in through an email code (OTP). Shared rooms with signed invitations and real-time updates with Laravel Reverb. Web push notifications, queues, and scheduled tasks on Redis.',
    },
    result: {
      es: 'Una aplicación web pública en tvradar.sgmr.es con explorador, seguimiento, estrenos, pendientes y sesiones familiares. Se despliega con Docker en Dokploy (FrankenPHP, PostgreSQL y Redis).',
      en: 'A public web application at tvradar.sgmr.es with an explorer, tracking, premieres, watchlist, and family viewing sessions. It is deployed with Docker on Dokploy (FrankenPHP, PostgreSQL, and Redis).',
    },
    technologies: [
      'PHP 8.5',
      'Laravel 13',
      'Livewire 4',
      'Flux',
      'Laravel Reverb',
      'PostgreSQL',
      'Redis',
      'Tailwind CSS 4',
      'Vite',
      'Playwright',
      'Docker',
      'Dokploy',
    ],
    evidenceUrl: 'https://tvradar.sgmr.es/',
    imageKey: 'tvradar',
    experienceIds: [],
  },
  {
    id: 'duellum',
    kind: 'case-study',
    title: { es: 'Duellum', en: 'Duellum' },
    titleFocus: {
      es: 'Aplicación web con React',
      en: 'React web application',
    },
    summary: {
      es: 'Compara opciones por parejas, gestiona pases automáticos y guarda los resultados localmente en tu dispositivo.',
      en: 'Compare options pair by pair, manage automatic byes, and save results locally on your device.',
    },
    tasks: {
      es: [
        'Lógica de cuadro eliminatorio derivada del historial, con pases automáticos repartidos',
        'Persistencia local versionada con recuperación de errores',
        'Deshacer y reanudar sin perder el estado',
        'Imagen del resultado con Canvas y Web Share, con descarga como alternativa',
        'Enlaces públicos firmados con imagen para redes (Vercel Edge)',
        'Pruebas por capas con Vitest y Testing Library',
      ],
      en: [
        'Knockout bracket logic derived from the history, with automatic byes spread across the bracket',
        'Versioned local persistence with error recovery',
        'Undo and resume without losing state',
        'Result image with Canvas and Web Share, with download as a fallback',
        'Signed public links with a social image (Vercel Edge)',
        'Layered tests with Vitest and Testing Library',
      ],
    },
    problem: {
      es: 'Elegir entre muchas opciones (un restaurante, un nombre, una película) es más fácil comparándolas de dos en dos. Duellum convierte la decisión en un cuadro eliminatorio rápido.',
      en: 'Choosing among many options (a restaurant, a name, a movie) is easier when you compare them two at a time. Duellum turns the decision into a quick knockout bracket.',
    },
    responsibility: {
      es: 'Proyecto personal desarrollado en solitario, de la lógica del cuadro a la interfaz y el despliegue.',
      en: 'Personal project built solo, from the bracket logic to the interface and deployment.',
    },
    solution: {
      es: 'React 19 y TypeScript con Vite, organizado en capas: dominio, estado, almacenamiento y compartir. La lógica del cuadro es pura: los emparejamientos, el progreso y deshacer se derivan del orden inicial y del historial de ganadores. Por eso, al recargar o deshacer se reproduce exactamente el mismo cuadro. El cuadro se ajusta a la siguiente potencia de dos. Las opciones sobrantes pasan de ronda automáticamente, y esos pases se reparten por todo el cuadro. Los datos se guardan solo en el navegador, con un formato versionado y recuperación ante datos dañados. Los enlaces públicos al resultado llevan una imagen para redes generada en Vercel Edge Functions.',
      en: 'React 19 and TypeScript with Vite, organized in layers: domain, state, storage, and sharing. The bracket logic is pure: pairings, progress, and undo are derived from the initial order and the history of winners. That is why reloading or undoing reproduces exactly the same bracket. The bracket is adjusted to the next power of two. Surplus options advance to the next round automatically, and those byes are spread across the whole bracket. Data is stored only in the browser, with a versioned format and recovery from corrupted data. Public result links carry a social image generated with Vercel Edge Functions.',
    },
    result: {
      es: 'Una aplicación web pública para cuadros de 2 a 16 opciones, con deshacer, la posibilidad de reanudar más tarde, una imagen del ganador para compartir (Web Share o descarga) y un enlace público al resultado.',
      en: 'A public web application for brackets of 2 to 16 options, with undo, the ability to resume later, an image of the winner to share (Web Share or download), and a public link to the result.',
    },
    technologies: [
      'React 19',
      'TypeScript',
      'Vite',
      'Tailwind CSS 4',
      'Vercel Edge Functions',
      '@vercel/og',
      'Vitest',
      'Testing Library',
    ],
    evidenceUrl: 'https://duellum.vercel.app/',
    imageKey: 'duellum',
    experienceIds: [],
  },
  {
    id: 'uploadimg',
    kind: 'case-study',
    title: { es: 'Uploadimg', en: 'Uploadimg' },
    titleFocus: { es: 'Servicio web con Astro', en: 'Astro web service' },
    summary: {
      es: 'Selecciona o pega una imagen, revisa la vista previa y súbela para compartir un enlace temporal de 24 horas.',
      en: 'Select or paste an image, review the preview, and upload it to share a temporary 24-hour link.',
    },
    tasks: {
      es: [
        'Subida en dos pasos con tickets firmados y Vercel Blob',
        'Validación de formato, tamaño y dimensiones',
        'Procesado con sharp: orientación, redimensionado y conversión a WebP',
        'Caducidad comprobada en cada lectura y limpieza programada con cron',
        'Cuotas por cliente y reportes de contenido',
        'API que usa la aplicación de escritorio',
      ],
      en: [
        'Two-step upload with signed tickets and Vercel Blob',
        'Validation of format, size, and dimensions',
        'Processing with sharp: orientation, resizing, and conversion to WebP',
        'Expiry checked on every read and scheduled cleanup with cron',
        'Per-client quotas and content reports',
        'API used by the desktop application',
      ],
    },
    problem: {
      es: 'Compartir una captura o una imagen puntual no debería obligar a subirla a un servicio permanente. Uploadimg genera un enlace que caduca a las 24 horas.',
      en: 'Sharing a screenshot or a one-off image should not require uploading it to a permanent service. Uploadimg generates a link that expires after 24 hours.',
    },
    responsibility: {
      es: 'Proyecto personal desarrollado en solitario.',
      en: 'Personal project built solo.',
    },
    solution: {
      es: 'Astro 7 en modo servidor sobre Vercel, con las imágenes y el estado en Vercel Blob. La subida se hace en dos pasos (preparar, subir y finalizar), con un ticket ligado al tamaño y al tipo del archivo. Se aceptan JPG, PNG o WebP estático de hasta 10 MB y 16 megapíxeles. Con sharp la imagen se orienta, se reduce a un máximo de 1920 px y se convierte a WebP sin metadatos; el original se retira. No hay base de datos: el estado vive en un registro JSON en Vercel Blob con escrituras condicionales. Cada lectura comprueba la caducidad de 24 horas, y un cron diario protegido limpia lo caducado. Tiene cuotas contra abusos (100 imágenes y 100 MB en total, 20 subidas al día por cliente, identificado con un HMAC de la IP) y un sistema de reportes.',
      en: 'Astro 7 in server mode on Vercel, with the images and the state stored in Vercel Blob. Uploading takes place in two steps (prepare, upload, and finalize), with a ticket tied to the size and type of the file. JPG, PNG, or static WebP files of up to 10 MB and 16 megapixels are accepted. With sharp, the image is oriented, scaled down to a maximum of 1920 px, and converted to WebP without metadata; the original is removed. There is no database: the state lives in a JSON registry in Vercel Blob with conditional writes. Every read checks the 24-hour expiry, and a protected daily cron cleans up what has expired. It has quotas against abuse (100 images and 100 MB in total, 20 uploads per day per client, identified by an HMAC of the IP) and a reporting system.',
    },
    result: {
      es: 'Un servicio web público en uploadimg.vercel.app: arrastras, eliges o pegas una imagen, revisas la vista previa y obtienes un enlace temporal. Es la base de la aplicación de escritorio UploadIMG.',
      en: 'A public web service at uploadimg.vercel.app: you drag, choose, or paste an image, review the preview, and get a temporary link. It is the foundation of the UploadIMG desktop application.',
    },
    technologies: [
      'Astro 7',
      'TypeScript',
      'Vercel',
      'Vercel Blob',
      'sharp',
      'Tailwind CSS 4',
      'node:test',
    ],
    evidenceUrl: 'https://uploadimg.vercel.app/',
    imageKey: 'uploadimg',
    experienceIds: [],
  },
  {
    id: 'uploadimg-desktop',
    kind: 'case-study',
    title: { es: 'UploadIMG - Desktop', en: 'UploadIMG - Desktop' },
    titleFocus: {
      es: 'App para macOS',
      en: 'macOS app',
    },
    summary: {
      es: 'Desde la barra de menús de macOS (Apple Silicon), pega una imagen, revisa la vista previa y compártela con un enlace temporal de 24 horas.',
      en: 'From the macOS menu bar (Apple Silicon), paste an image, review the preview, and share it with a temporary 24-hour link.',
    },
    tasks: {
      es: [
        'Ciclo de vida en la barra de menús: mostrar, ocultar, pausar y salir',
        'Detección opcional del portapapeles, con la preferencia guardada',
        'Subida con validación y caducidad de 24 horas',
        'Actualizaciones automáticas firmadas',
        'Pipeline de compilación y empaquetado DMG con sumas SHA-256',
      ],
      en: [
        'Menu bar lifecycle: show, hide, pause, and quit',
        'Optional clipboard detection, with the preference saved',
        'Upload with validation and a 24-hour expiry',
        'Signed automatic updates',
        'Build and DMG packaging pipeline with SHA-256 checksums',
      ],
    },
    problem: {
      es: 'Compartir una captura desde el Mac con Uploadimg obligaba a abrir el navegador. UploadIMG Desktop lo hace desde la barra de menús.',
      en: 'Sharing a screenshot from the Mac with Uploadimg meant opening the browser. UploadIMG Desktop does it from the menu bar.',
    },
    responsibility: {
      es: 'Proyecto personal desarrollado en solitario: aplicación, integración nativa con macOS y distribución.',
      en: 'Personal project built solo: the application, native macOS integration, and distribution.',
    },
    solution: {
      es: 'Aplicación Tauri 2 con el núcleo en Rust. Integración nativa en Swift: icono en la barra de menús, portapapeles y notificaciones. La subida usa la API de Uploadimg, con validación y caducidad de 24 horas. Actualizaciones automáticas firmadas con el actualizador de Tauri, y compilación en GitHub Actions.',
      en: 'A Tauri 2 application with its core in Rust. Native integration in Swift: menu bar icon, clipboard, and notifications. Uploading uses the Uploadimg API, with validation and a 24-hour expiry. Automatic updates signed with the Tauri updater, and builds on GitHub Actions.',
    },
    result: {
      es: 'Una beta pública para macOS Apple Silicon (0.1.0-beta.4), descargable como DMG desde GitHub Releases, con actualizaciones firmadas. No lleva firma de Apple Developer ID ni notarización.',
      en: 'A public beta for macOS Apple Silicon (0.1.0-beta.4), downloadable as a DMG from GitHub Releases, with signed updates. It is not signed with an Apple Developer ID or notarized.',
    },
    technologies: [
      'Rust',
      'Tauri 2',
      'Swift',
      'Tokio',
      'Reqwest',
      'GitHub Actions',
    ],
    evidenceUrl: 'https://github.com/SergioGMR/uploadimg-desktop/releases',
    imageKey: 'uploadimg-desktop',
    experienceIds: [],
  },
]

export const PROFILE_LINKS = {
  github: 'https://github.com/sergiogmr',
  linkedin: 'https://www.linkedin.com/in/sergiogmr/',
  twitter: 'https://x.com/sergiogmr',
  mail: 'mailto:sergiogmr+portfolio@icloud.com',
} as const

export const PROFESSIONAL_PROFILE: ProfessionalProfile = {
  person: {
    name: 'Sergio Morales Rodríguez',
    headline: {
      es: 'Tech Lead Full Stack',
      en: 'Tech Lead Full Stack',
    },
    location: { es: 'Las Palmas, España', en: 'Las Palmas, Spain' },
  },
  links: PROFILE_LINKS,
  cvUrls: {
    es: '/sergio-morales-es.pdf',
    en: '/sergio-morales-en.pdf',
  },
  experiences,
  projects,
  education: [
    {
      id: 'web-application-development',
      qualification: {
        es: 'Certificado de Educación Superior en Desarrollo de Aplicaciones Web',
        en: 'Certificate of Higher Education in Web Application Development',
      },
      institution: { es: 'I.E.S. El Rincón', en: 'I.E.S. El Rincón' },
      location: {
        es: 'Las Palmas de G.C., España',
        en: 'Las Palmas de Gran Canaria, Spain',
      },
      startDate: '2016-06-30',
      endDate: '2018-04-30',
      level: 'EQF/MEC 5',
    },
  ],
  languages: [
    {
      id: 'english',
      name: { es: 'Inglés', en: 'English' },
      levels: {
        listening: 'B2',
        reading: 'B2',
        writing: 'B1',
        spokenProduction: 'B1',
        spokenInteraction: 'B1',
      },
    },
  ],
  capabilities: [
    {
      id: 'backend-and-apis',
      label: { es: 'Backend y APIs', en: 'Backend and APIs' },
      summary: {
        es: 'Desarrollo de backend y APIs con Laravel, Livewire, FilamentPHP y Laravel Sanctum.',
        en: 'Backend and API development with Laravel, Livewire, FilamentPHP, and Laravel Sanctum.',
      },
      technologies: ['Laravel', 'Livewire', 'FilamentPHP', 'Laravel Sanctum'],
      evidenceIds: ['current-project', 'tecandu', 'freelance-2020'],
    },
    {
      id: 'web-and-mobile',
      label: {
        es: 'Aplicaciones web y móvil',
        en: 'Web and mobile applications',
      },
      summary: {
        es: 'Entrega de frontend, aplicaciones web y aplicaciones móviles con Astro, Livewire y Quasar Framework.',
        en: 'Delivery of frontend, web applications, and mobile applications with Astro, Livewire, and Quasar Framework.',
      },
      technologies: ['Astro 7', 'Livewire', 'Quasar Framework'],
      evidenceIds: ['current-project', 'freelance-2020'],
    },
    {
      id: 'technical-coordination',
      label: { es: 'Coordinación técnica', en: 'Technical coordination' },
      summary: {
        es: 'Coordinación de equipos de desarrollo y DevOps y traducción de necesidades en trabajo entregable.',
        en: 'Coordination of development and DevOps teams and translation of needs into deliverable work.',
      },
      technologies: [
        'Tech leadership',
        'Development coordination',
        'DevOps coordination',
      ],
      evidenceIds: ['current-project', 'tecandu'],
    },
    {
      id: 'delivery-and-testing',
      label: { es: 'Entrega y pruebas', en: 'Delivery and testing' },
      summary: {
        es: 'Planificación e implementación de pruebas y desarrollo de CI/CD con GitHub Actions y Plesk.',
        en: 'Planning and implementation of tests and CI/CD development with GitHub Actions and Plesk.',
      },
      technologies: ['Testing', 'CI/CD', 'GitHub Actions', 'Plesk'],
      evidenceIds: ['tecandu'],
    },
  ],
}

export function sortExperiencesByStartDate(
  values: readonly Experience[],
): Experience[] {
  return [...values].sort((left, right) =>
    right.startDate.localeCompare(left.startDate),
  )
}
