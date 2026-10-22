import { describe, expect, test } from 'bun:test'
import {
  PROFESSIONAL_PROFILE,
  sortExperiencesByStartDate,
  type Experience,
  type Project,
} from './professional-profile'

const esText = (value: { es: string | readonly string[] }) =>
  Array.isArray(value.es) ? value.es.join(' ') : value.es

const enText = (value: { en: string | readonly string[] }) =>
  Array.isArray(value.en) ? value.en.join(' ') : value.en

describe('professional profile', () => {
  test('keeps the canonical experience chronology and explicit employment metadata', () => {
    const sorted = sortExperiencesByStartDate(PROFESSIONAL_PROFILE.experiences)

    expect(sorted.map(({ id }) => id)).toEqual([
      'current-project',
      'tecandu',
      'freelance-2020',
    ])
    expect(sorted.map(({ startDate }) => startDate)).toEqual([
      '2023-12-01',
      '2023-10-01',
      '2020-06-30',
    ])

    expect(sorted[0]).toMatchObject({
      id: 'current-project',
      title: {
        es: 'Project Manager | Tech Leader | FullStack Developer',
        en: 'Project Manager | Tech Leader | FullStack Developer',
      },
      employmentType: 'freelance',
      status: 'current',
      startDate: '2023-12-01',
      endDate: null,
      company: { es: 'Freelance', en: 'Freelance' },
      location: { es: 'Las Palmas, España', en: 'Las Palmas, Spain' },
    })
    expect(sorted[1]).toMatchObject({
      id: 'tecandu',
      title: { es: 'FullStack Developer', en: 'FullStack Developer' },
      employmentType: 'freelance',
      status: 'completed',
      startDate: '2023-10-01',
      endDate: '2024-04-23',
      company: {
        es: 'Freelance | Tecandu S.L.',
        en: 'Freelance | Tecandu S.L.',
      },
    })
    expect(sorted[2]).toMatchObject({
      id: 'freelance-2020',
      title: { es: 'Fullstack Developer', en: 'Fullstack Developer' },
      employmentType: 'freelance',
      status: 'completed',
      startDate: '2020-06-30',
      endDate: '2020-10-10',
    })
  })

  test('uses localized fields on each record with matching IDs and no parallel arrays', () => {
    const ids = PROFESSIONAL_PROFILE.experiences.map(({ id }) => id)
    const projectIds = PROFESSIONAL_PROFILE.projects.map(({ id }) => id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(projectIds).size).toBe(projectIds.length)
    expect(PROFESSIONAL_PROFILE.experiences).toHaveLength(3)
    expect(PROFESSIONAL_PROFILE.projects).toHaveLength(8)

    for (const experience of PROFESSIONAL_PROFILE.experiences) {
      expect(experience.title.es).toBeTruthy()
      expect(experience.title.en).toBeTruthy()
      expect(experience.responsibilities.es.length).toBeGreaterThan(0)
      expect(experience.responsibilities.en.length).toBe(
        experience.responsibilities.es.length,
      )
      expect(experience.outcomes.es.length).toBeGreaterThan(0)
      expect(experience.outcomes.en.length).toBe(experience.outcomes.es.length)
    }
  })

  test('keeps projects independent with optional experience links', () => {
    const projects = PROFESSIONAL_PROFILE.projects as readonly Project[]
    const experiences =
      PROFESSIONAL_PROFILE.experiences as readonly Experience[]

    expect(projects.map(({ id }) => id)).toEqual([
      'jauntjar',
      'todo-lux',
      'basuraleza',
      'wattly',
      'tvradar',
      'duellum',
      'uploadimg',
      'uploadimg-desktop',
    ])
    for (const project of projects) {
      expect(project.evidenceUrl).toMatch(/^https:\/\//)
      expect(project.kind).toBe('case-study')
      expect('category' in project).toBe(false)
      for (const field of [
        'summary',
        'titleFocus',
        'problem',
        'responsibility',
        'solution',
        'result',
      ] as const) {
        expect(project[field].es.trim()).toBeTruthy()
        expect(project[field].en.trim()).toBeTruthy()
      }
      expect(project.tasks.es.length).toBeGreaterThan(0)
      expect(project.tasks.en.length).toBe(project.tasks.es.length)
      expect(project.technologies.length).toBeGreaterThan(0)
      if (project.experienceIds.length > 0) {
        expect(
          project.experienceIds.every((experienceId) =>
            experiences.some(({ id }) => id === experienceId),
          ),
        ).toBe(true)
      }
    }

    expect(projects[0]).toMatchObject({
      id: 'jauntjar',
      title: { es: 'JauntJar', en: 'JauntJar' },
      evidenceUrl: 'https://trips.sgmr.es/',
      experienceIds: [],
    })

    expect(JSON.stringify(projects)).not.toMatch(/Tca-Tik/i)
    expect(JSON.stringify(projects)).not.toMatch(/hexagonal|TDD/i)
    // React is a real claim only for Duellum.
    expect(
      projects
        .filter((project) => /React/.test(JSON.stringify(project)))
        .map(({ id }) => id),
    ).toEqual(['duellum'])
  })

  test('documents the five former showcases as bilingual case studies', () => {
    const byId = (id: string) =>
      PROFESSIONAL_PROFILE.projects.find((project) => project.id === id)!
    expect(PROFESSIONAL_PROFILE.projects.map(({ kind }) => kind)).toEqual(
      Array(8).fill('case-study'),
    )

    expect(byId('wattly')).toMatchObject({
      summary: {
        es: 'Compara los precios horarios de la electricidad en España y encuentra las horas más económicas para usar tus electrodomésticos.',
        en: 'Compare hourly electricity prices in Spain and find the most economical times to use your appliances.',
      },
      titleFocus: {
        es: 'Aplicación web con Astro',
        en: 'Astro web application',
      },
      problem: {
        es: 'El precio regulado de la luz (PVPC) cambia cada hora en España, y consultarlo no basta para decidir cuándo poner la lavadora o el lavavajillas. Wattly muestra el precio hora a hora y señala las franjas más baratas para cada electrodoméstico.',
      },
      responsibility: {
        es: 'Proyecto personal desarrollado en solitario: producto, interfaz, web y API de precios propia.',
      },
      evidenceUrl: 'https://wattly-alpha.vercel.app/',
      experienceIds: [],
    })
    expect(byId('tvradar')).toMatchObject({
      summary: {
        es: 'Organiza tus series, estrenos, pendientes y sesiones familiares en un solo lugar.',
        en: 'Organize your series, premieres, watchlist, and family viewing in one place.',
      },
      titleFocus: {
        es: 'Desarrollo con Laravel',
        en: 'Laravel development',
      },
      problem: {
        es: 'Seguir series repartidas entre varias plataformas de streaming (qué capítulos faltan, qué se estrena y dónde ver cada una) suele acabar en notas sueltas. TVRadar lo centraliza y permite compartir el seguimiento con la familia.',
      },
      evidenceUrl: 'https://tvradar.sgmr.es/',
    })
    expect(byId('duellum')).toMatchObject({
      summary: {
        es: 'Compara opciones por parejas, gestiona pases automáticos y guarda los resultados localmente en tu dispositivo.',
        en: 'Compare options pair by pair, manage automatic byes, and save results locally on your device.',
      },
      titleFocus: {
        es: 'Aplicación web con React',
        en: 'React web application',
      },
      problem: {
        es: 'Elegir entre muchas opciones (un restaurante, un nombre, una película) es más fácil comparándolas de dos en dos. Duellum convierte la decisión en un cuadro eliminatorio rápido.',
      },
      evidenceUrl: 'https://duellum.vercel.app/',
    })
    expect(byId('uploadimg')).toMatchObject({
      summary: {
        es: 'Selecciona o pega una imagen, revisa la vista previa y súbela para compartir un enlace temporal de 24 horas.',
        en: 'Select or paste an image, review the preview, and upload it to share a temporary 24-hour link.',
      },
      titleFocus: {
        es: 'Servicio web con Astro',
        en: 'Astro web service',
      },
      problem: {
        es: 'Compartir una captura o una imagen puntual no debería obligar a subirla a un servicio permanente. Uploadimg genera un enlace que caduca a las 24 horas.',
      },
      evidenceUrl: 'https://uploadimg.vercel.app/',
    })
    expect(byId('uploadimg-desktop')).toMatchObject({
      summary: {
        es: 'Desde la barra de menús de macOS (Apple Silicon), pega una imagen, revisa la vista previa y compártela con un enlace temporal de 24 horas.',
        en: 'From the macOS menu bar (Apple Silicon), paste an image, review the preview, and share it with a temporary 24-hour link.',
      },
      titleFocus: {
        es: 'App para macOS',
        en: 'macOS app',
      },
      problem: {
        es: 'Compartir una captura desde el Mac con Uploadimg obligaba a abrir el navegador. UploadIMG Desktop lo hace desde la barra de menús.',
      },
      evidenceUrl: 'https://github.com/SergioGMR/uploadimg-desktop/releases',
    })

    for (const id of ['jauntjar', 'todo-lux', 'basuraleza']) {
      expect(byId(id).titleFocus.es).toBe('Desarrollo con Laravel')
      expect(byId(id).titleFocus.en).toBe('Laravel development')
    }
  })

  test('translates each new case study without copying the Spanish text', () => {
    for (const id of [
      'wattly',
      'tvradar',
      'duellum',
      'uploadimg',
      'uploadimg-desktop',
    ]) {
      const project = PROFESSIONAL_PROFILE.projects.find((p) => p.id === id)!
      for (const field of [
        'problem',
        'responsibility',
        'solution',
        'result',
      ] as const) {
        expect(project[field].en).not.toBe(project[field].es)
        // No Spanish article or connective survives in the English text.
        expect(project[field].en).not.toMatch(/\b(el|la|los|las|de|del|con)\b/)
      }
      expect(project.solution.es.length).toBeGreaterThan(150)
      expect(project.result.es.length).toBeGreaterThan(50)
      // Prose paragraphs: no bullets or Markdown links leak into the text.
      for (const field of ['solution', 'result'] as const)
        for (const language of ['es', 'en'] as const)
          expect(project[field][language]).not.toMatch(/^\s*[-*]\s|\]\(/m)
    }
  })

  test('includes canonical education, language evidence, and stable CV URLs', () => {
    expect(PROFESSIONAL_PROFILE.education).toHaveLength(1)
    expect(PROFESSIONAL_PROFILE.education[0]).toMatchObject({
      id: 'web-application-development',
      startDate: '2016-06-30',
      endDate: '2018-04-30',
      institution: { es: 'I.E.S. El Rincón', en: 'I.E.S. El Rincón' },
      qualification: {
        es: 'Certificado de Educación Superior en Desarrollo de Aplicaciones Web',
        en: 'Certificate of Higher Education in Web Application Development',
      },
      level: 'EQF/MEC 5',
    })
    expect(PROFESSIONAL_PROFILE.languages).toEqual([
      expect.objectContaining({
        id: 'english',
        name: { es: 'Inglés', en: 'English' },
        levels: {
          listening: 'B2',
          reading: 'B2',
          writing: 'B1',
          spokenProduction: 'B1',
          spokenInteraction: 'B1',
        },
      }),
    ])
    expect(PROFESSIONAL_PROFILE.cvUrls).toEqual({
      es: '/sergio-morales-es.pdf',
      en: '/sergio-morales-en.pdf',
    })
    expect(JSON.stringify(PROFESSIONAL_PROFILE)).not.toMatch(
      /2024-(es|en)\.pdf/,
    )
  })

  test('connects every displayed capability to canonical evidence IDs', () => {
    const evidenceIds = new Set([
      ...PROFESSIONAL_PROFILE.experiences.map(({ id }) => id),
      ...PROFESSIONAL_PROFILE.projects.map(({ id }) => id),
    ])

    expect(PROFESSIONAL_PROFILE.capabilities.length).toBeGreaterThan(0)
    for (const capability of PROFESSIONAL_PROFILE.capabilities) {
      expect(capability.label.es).toBeTruthy()
      expect(capability.label.en).toBeTruthy()
      expect(capability.summary.es).toBeTruthy()
      expect(capability.summary.en).toBeTruthy()
      expect(capability.technologies.length).toBeGreaterThan(0)
      expect(capability.evidenceIds.every((id) => evidenceIds.has(id))).toBe(
        true,
      )
    }

    expect(
      PROFESSIONAL_PROFILE.capabilities
        .find(({ id }) => id === 'web-and-mobile')
        ?.technologies.includes('Astro 7'),
    ).toBe(true)
  })

  test('does not include unsupported or stale professional claims', () => {
    const serialized = JSON.stringify(PROFESSIONAL_PROFILE)

    expect(serialized).not.toMatch(/Tca-Tik/i)
    expect(serialized).not.toMatch(/hexagonal architecture|TDD/i)
    // Outside the projects, React is not a claim: only Duellum builds with it.
    expect(JSON.stringify(PROFESSIONAL_PROFILE.experiences)).not.toMatch(
      /\bReact\b/,
    )
    expect(JSON.stringify(PROFESSIONAL_PROFILE.capabilities)).not.toMatch(
      /\bReact\b/,
    )
    expect(
      esText(PROFESSIONAL_PROFILE.experiences[0].responsibilities),
    ).toContain('Laravel')
    expect(
      enText(PROFESSIONAL_PROFILE.experiences[0].responsibilities),
    ).toContain('Laravel')
  })

  test('keeps the Wattly case study free of scraping and mobile claims', () => {
    const wattly = PROFESSIONAL_PROFILE.projects.find(
      ({ id }) => id === 'wattly',
    )
    expect(wattly).toBeDefined()
    expect(JSON.stringify(wattly)).not.toMatch(/tarifaluz|scrap|móvil|mobile/i)
  })

  test('writes case-study tasks as fragments without a trailing period', () => {
    for (const project of PROFESSIONAL_PROFILE.projects)
      for (const language of ['es', 'en'] as const)
        for (const task of project.tasks[language])
          expect(`${project.id} ${language}: ${task}`).not.toMatch(/\.$/)
  })

  test('words the English case studies as natural English', () => {
    const en = JSON.stringify(
      PROFESSIONAL_PROFILE.projects.map((project) => [
        project.tasks.en,
        project.solution.en,
        project.result.en,
      ]),
    )
    for (const phrase of [
      'Domain-based modular architecture with Laravel',
      'signed invitations and real-time updates',
      'real-time updates with Laravel Reverb',
      'automatic byes spread across the bracket',
      'It is not signed with an Apple Developer ID or notarized.',
      'Its own price REST API',
    ])
      expect(en).toContain(phrase)
    for (const phrase of [
      'Modular architecture by domains',
      'and real time',
      'real time with',
      'evenly spread',
      'carries no Apple Developer ID',
      'Its own REST price API',
    ])
      expect(en).not.toContain(phrase)
  })
})
