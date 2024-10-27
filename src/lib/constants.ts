import type { Site, Page } from './types'

export const loaderAnimation = [
  '.loader',
  { opacity: [1, 0], pointerEvents: 'none' },
  { easing: 'ease-out' },
]

export const LINKS = {
  github: 'https://github.com/sergiogmr',
  linkedin: 'https://www.linkedin.com/in/sergiogmr/',
  mail: 'mailto:sergiogmr+portfolio@icloud.com',
  acesports: 'https://acesports.vercel.app/',
  medium: 'https://ladvace.medium.com/',
  discord: 'https://discordapp.com/users/163300027618295808',
}

// Global
export const SITE: Site = {
  TITLE: 'Astro Sphere',
  DESCRIPTION:
    'Welcome to Astro Sphere, a portfolio and blog for designers and developers.',
  AUTHOR: 'Mark Horn',
}

// Work Page
export const WORK: Page = {
  TITLE: 'Work',
  DESCRIPTION: 'Places I have worked.',
}

// Blog Page
export const BLOG: Page = {
  TITLE: 'Blog',
  DESCRIPTION: 'Writing on topics I am passionate about.',
}

// Projects Page
export const PROJECTS: Page = {
  TITLE: 'Projects',
  DESCRIPTION: 'Recent projects I have worked on.',
}

// Search Page
export const SEARCH: Page = {
  TITLE: 'Search',
  DESCRIPTION: 'Search all posts and projects by keyword.',
}

export const STACK = [
  'PHP',
  'Laravel',
  'JavaScript',
  'TypeScript',
  'React',
  'React Native',
  'Vue',
  'Git',
  'CSS',
  'Tailwind CSS',
  'Bootstrap',
]

// Study Page
export const STUDIES = [
  {
    title: 'Desarrollo Apps Web',
    institution: 'El Rincón',
    link: 'https://ieselrincon.es/',
    date: '2016 - 2018',
  },
  {
    title: '...',
    institution: 'Platzi',
    link: 'https://platzi.com/',
    date: '2018 - actualidad',
  },
  {
    title: '...',
    institution: 'Udemy',
    link: 'https://www.udemy.com/',
    date: '2018 - actualidad',
  },
  {
    title: '...',
    institution: 'Youtube',
    link: 'https://www.youtube.com/',
    date: '2018 - actualidad',
  },
  {
    title: '...',
    institution: 'Twitch',
    link: 'https://twitch.tv/',
    date: '2018 - actualidad',
  },
]

export const EXPERIENCE = {
  es: [
    {
      company: 'Freelance',
      location: 'Las Palmas, España',
      position: 'Project Manager',
      start: '2023-12',
      end: 'Actualmente',
      tasks: [
        'Análisis de las necesidades del sistema',
        'Diseño de la base de datos',
        'Desarrollo del BackOffice y el sistema de backups',
        'Diseño del sistema de importación de archivos BMCAT',
        'Desarrollo del frontend',
        'Lógica de eventos y colas',
        'Desarrollo usando Laravel, Livewire, Filamentphp',
      ],
    },
    {
      company: 'Freelance',
      location: 'Las Palmas, España',
      position: 'FullStack Developer',
      start: '2020-06',
      end: '2020-10',
      tasks: [
        'Desarrollando el backend de esta aplicación con Laravel',
        'Desarrollando la aplicación móvil con QuasarFramework',
        'Desarrollando una aplicación web con Laravel y Livewire',
        'Desarrollando una aplicación móvil con QuasarFramework',
        'Desarrollando el backend para esta aplicación con Laravel',
      ],
    },
    {
      company: 'Freelance | Tecandu S.L.',
      location: 'España',
      position: 'FullStack Developer',
      start: '2023-01',
      end: '2024-04',
      tasks: [
        'Adaptación de tecnologías a los nuevos tiempos',
        'Coordinación del equipo de desarrollo y del equipo DevOps',
        'Estudio y rediseño de la base de datos y desarrollo para la transferencia sin pérdida de datos o funcionalidad',
        'Desarrollo de una nueva versión, v3, de la API utilizando Laravel Sanctum',
        'Planificación de las pruebas faltantes y su implementación',
        'Desarrollo CI-CD con Github Actions y Plesk',
      ],
    },
    {
      company: 'Tca-Tik',
      location: 'Las Palmas de Gran Canaria, España',
      position: 'FullStack Developer',
      start: '2019-05',
      end: '2020-02',
      tasks: [
        'Desarrollador Frontend con VueJS, jQuery, Bootstrap',
        'Desarrollador Backend con Laravel',
        'Trabajando con algunos productos de la empresa',
      ],
    },
  ],
  en: [
    {
      company: 'Freelance',
      location: 'Las Palmas, Spain',
      position: 'Project Manager | Tech Leader | FullStack Developer',
      start: '2023-12',
      end: 'Current',
      tasks: [
        'Analysis of system requirements',
        'Database design',
        'Development of BackOffice and backup system',
        'Design of file import system for BMCAT',
        'Frontend development',
        'Event and queue logic',
        'Development using Laravel, Livewire, Filamentphp',
      ],
    },
    {
      company: 'Freelance',
      location: 'Las Palmas, Spain',
      position: 'FullStack Developer',
      start: '2020-06',
      end: '2020-10',
      tasks: [
        'Developing the backend of this application with Laravel',
        'Developing the mobile application with QuasarFramework',
        'Developing a web application with Laravel and Livewire',
        'Developing a mobile application with QuasarFramework',
        'Developing the backend for this application with Laravel',
      ],
    },
    {
      company: 'Freelance | Tecandu S.L.',
      location: 'Spain',
      position: 'FullStack Developer',
      start: '2023-01',
      end: '2024-04',
      tasks: [
        'Adaptation of technologies to new standards',
        'Coordination of the development team and the DevOps team',
        'Study and redesign of the database and development for lossless data transfer',
        'Development of a new version, v3, of the API using Laravel Sanctum',
        'Planning of pending tests and their implementation',
        'CI-CD development with Github Actions and Plesk',
      ],
    },
    {
      company: 'Tca-Tik',
      location: 'Las Palmas de Gran Canaria, Spain',
      position: 'FullStack Developer',
      start: '2019-05',
      end: '2020-02',
      tasks: [
        'Frontend development with VueJS, jQuery, Bootstrap',
        'Backend development with Laravel',
        'Working with some of the company\'s products',
      ],
    },
  ]
}
