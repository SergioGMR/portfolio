import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

interface LocalizedText {
  readonly es: string
  readonly en: string
}

interface ShowcaseProject {
  readonly id: string
  readonly kind: 'showcase'
  readonly title: LocalizedText
  readonly category: LocalizedText
  readonly summary: LocalizedText
  readonly evidenceUrl: string
  readonly imageKey: string
  readonly experienceIds: readonly string[]
}

const expectedShowcases: readonly ShowcaseProject[] = [
  {
    id: 'wattly',
    kind: 'showcase',
    title: { es: 'Wattly', en: 'Wattly' },
    category: {
      es: 'Precios de la electricidad',
      en: 'Electricity prices',
    },
    summary: {
      es: 'Compara los precios horarios de la electricidad en España y encuentra las horas más económicas para usar tus electrodomésticos.',
      en: 'Compare hourly electricity prices in Spain and find the most economical times to use your appliances.',
    },
    evidenceUrl: 'https://wattly-alpha.vercel.app/',
    imageKey: 'wattly',
    experienceIds: [],
  },
  {
    id: 'tvradar',
    kind: 'showcase',
    title: { es: 'TVRadar', en: 'TVRadar' },
    category: { es: 'Seguimiento de series', en: 'TV series tracking' },
    summary: {
      es: 'Organiza tus series, estrenos, pendientes y sesiones familiares en un solo lugar.',
      en: 'Organize your series, premieres, watchlist, and family viewing in one place.',
    },
    evidenceUrl: 'https://tvradar.sgmr.es/',
    imageKey: 'tvradar',
    experienceIds: [],
  },
  {
    id: 'duellum',
    kind: 'showcase',
    title: { es: 'Duellum', en: 'Duellum' },
    category: { es: 'Cuadros de decisión', en: 'Decision brackets' },
    summary: {
      es: 'Compara opciones por parejas, gestiona pases automáticos y guarda los resultados localmente en tu dispositivo.',
      en: 'Compare options pair by pair, manage automatic byes, and save results locally on your device.',
    },
    evidenceUrl: 'https://duellum.vercel.app/',
    imageKey: 'duellum',
    experienceIds: [],
  },
]

describe('main integration project showcase', () => {
  test('appends three truthful showcase records after current main projects', () => {
    expect(PROFESSIONAL_PROFILE.projects.map(({ id }) => id)).toEqual([
      'jauntjar',
      'todo-lux',
      'basuraleza',
      'solutec',
      'wattly',
      'tvradar',
      'duellum',
    ])

    const showcases = PROFESSIONAL_PROFILE.projects.slice(4)
    expect(showcases).toEqual([...expectedShowcases])

    for (const project of showcases) {
      expect(project.experienceIds).toEqual([])
      expect('technologies' in project).toBe(false)
      expect('responsibility' in project).toBe(false)
      expect('result' in project).toBe(false)
    }
  })

  test('renders showcase summaries with the genuine project captures', async () => {
    const source = await readFile(
      new URL(
        '../src/components/sections/ProjectsSection.astro',
        import.meta.url,
      ),
      'utf8',
    )

    expect(source).toContain("project.kind === 'showcase'")

    for (const asset of ['wattly.webp', 'tvradar.webp', 'duellum.webp']) {
      expect(source).toContain(asset)
    }
  })
})
