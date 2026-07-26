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

export interface Project {
  readonly id: string
  readonly title: Localized<string>
  readonly problem: Localized<string>
  readonly responsibility: Localized<string>
  readonly solution: Localized<string>
  readonly result: Localized<string>
  readonly technologies: readonly string[]
  readonly evidenceUrl: string
  readonly imageKey: string
  readonly experienceIds: readonly string[]
}

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
    evidenceUrl: 'https://solutec.pccom.ai/',
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
        'Desarrollo de una aplicación móvil con Quasar Framework',
        'Desarrollo del backend de la aplicación con Laravel',
      ],
      en: [
        'Backend development for the application with Laravel',
        'Mobile application development with Quasar Framework',
        'Web application development with Laravel and Livewire',
        'Mobile application development with Quasar Framework',
        'Backend development for the application with Laravel',
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
      'https://proyectolibera.org/caracterizacion-residuos/basuraleza',
  },
]

const projects: readonly Project[] = [
  {
    id: 'jauntjar',
    title: { es: 'JauntJar', en: 'JauntJar' },
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
      es: 'Producto desplegado en trips.sgmr.es para organizar nuestros viajes y revisar cada experiencia.',
      en: 'Product deployed at trips.sgmr.es to organize our trips and review each experience.',
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
    title: { es: 'Todo-Lux', en: 'Todo-Lux' },
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
      es: 'El proyecto cuenta con un sitio público verificable en todo-lux.com.',
      en: 'The project has a publicly verifiable site at todo-lux.com.',
    },
    technologies: ['Laravel', 'Livewire', 'FilamentPHP'],
    evidenceUrl: 'https://todo-lux.com/',
    imageKey: 'todo-lux',
    experienceIds: ['current-project'],
  },
  {
    id: 'basuraleza',
    title: { es: 'Basuraleza', en: 'Basuraleza' },
    problem: {
      es: 'El proyecto necesitaba una aplicación con backend, web y móvil para la caracterización de residuos.',
      en: 'The project needed backend, web, and mobile applications for waste characterization.',
    },
    responsibility: {
      es: 'Desarrollo del backend con Laravel y de las aplicaciones web y móvil con Laravel, Livewire y Quasar Framework.',
      en: 'Development of the Laravel backend and the web and mobile applications with Laravel, Livewire, and Quasar Framework.',
    },
    solution: {
      es: 'Implementación coordinada de las superficies backend, web y móvil descritas en el CV.',
      en: 'Coordinated implementation of the backend, web, and mobile surfaces described in the CV.',
    },
    result: {
      es: 'La caracterización de residuos está publicada en el sitio de Proyecto Libera.',
      en: 'The waste characterization project is published on the Proyecto Libera site.',
    },
    technologies: ['Laravel', 'Livewire', 'Quasar Framework'],
    evidenceUrl:
      'https://proyectolibera.org/caracterizacion-residuos/basuraleza',
    imageKey: 'basuraleza',
    experienceIds: ['freelance-2020'],
  },
  {
    id: 'solutec',
    title: { es: 'Solutec', en: 'Solutec' },
    problem: {
      es: 'El producto necesitaba actualizar tecnologías y transferir datos sin perder información ni funcionalidades.',
      en: 'The product needed technology updates and data transfer without losing information or functionality.',
    },
    responsibility: {
      es: 'Coordinación de desarrollo y DevOps, rediseño de base de datos, API v3, pruebas y CI/CD.',
      en: 'Coordination of development and DevOps, database redesign, v3 API, tests, and CI/CD.',
    },
    solution: {
      es: 'Desarrollo de API v3 con Laravel Sanctum, planificación e implementación de pruebas y CI/CD con GitHub Actions y Plesk.',
      en: 'Development of a v3 API with Laravel Sanctum, test planning and implementation, and CI/CD with GitHub Actions and Plesk.',
    },
    result: {
      es: 'El producto dispone de un sitio público verificable en solutec.pccom.ai.',
      en: 'The product has a publicly verifiable site at solutec.pccom.ai.',
    },
    technologies: ['Laravel', 'Laravel Sanctum', 'GitHub Actions', 'Plesk'],
    evidenceUrl: 'https://solutec.pccom.ai/',
    imageKey: 'solutec',
    experienceIds: ['tecandu'],
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
      institution: { es: 'I.E.S. El Ricón', en: 'I.E.S. El Ricón' },
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
