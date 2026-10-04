import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

interface ProjectRecord {
  slug: string
  name: string
  url: string
  category: {
    es: string
    en: string
  }
  summary: {
    es: string
    en: string
  }
}

const root = join(import.meta.dirname, '..')
const index = readFileSync(join(root, 'src/pages/index.astro'), 'utf8')

describe('portfolio projects', () => {
  it('defines exactly three complete bilingual project records', async () => {
    const constants = (await import('../src/lib/constants')) as {
      PROJECTS?: ProjectRecord[]
    }
    const projects = constants.PROJECTS ?? []

    expect(projects).toHaveLength(3)
    expect(projects.map(({ name }) => name)).toEqual([
      'Wattly',
      'TVRadar',
      'Duellum',
    ])

    for (const project of projects) {
      expect(project.slug).not.toHaveLength(0)
      expect(project.name).not.toHaveLength(0)
      expect(project.url).toMatch(/^https:\/\//)
      expect(project.category.es).not.toHaveLength(0)
      expect(project.category.en).not.toHaveLength(0)
      expect(project.summary.es).not.toHaveLength(0)
      expect(project.summary.en).not.toHaveLength(0)
    }
  })

  it('uses unique slugs and the verified public destinations', async () => {
    const constants = (await import('../src/lib/constants')) as {
      PROJECTS?: ProjectRecord[]
    }
    const projects = constants.PROJECTS ?? []
    const slugs = projects.map(({ slug }) => slug)
    const urls = projects.map(({ url }) => url)

    expect(new Set(slugs).size).toBe(projects.length)
    expect(new Set(urls).size).toBe(projects.length)
    expect(urls).toEqual([
      'https://wattly-alpha.vercel.app/',
      'https://tvradar.sgmr.es/',
      'https://duellum.vercel.app/',
    ])
  })

  it('renders one seven-card loop with a single lead and safe external links', () => {
    expect(index).toContain('projectCards.map')
    expect(index).not.toContain('experienceCards.map')
    expect(index).toContain('EXPERIENCE.es.slice(0, 4)')
    expect(index).toContain('...legacyProjectCards')
    expect(index).toContain('...PROJECTS.map')
    expect(index).toContain("idx === 0 ? 'lead' : 'supporting'")
    expect(index).toContain('target="_blank"')
    expect(index).toContain('rel="noreferrer noopener"')

    for (const asset of [
      'todo-lux.webp',
      'basuraleza.webp',
      'solutec.webp',
      'tcatik.webp',
      'wattly.webp',
      'tvradar.webp',
      'duellum.webp',
    ]) {
      expect(index).toContain(asset)
    }
  })

  it('stores each real screenshot at the card aspect ratio', async () => {
    for (const asset of ['wattly.webp', 'tvradar.webp', 'duellum.webp']) {
      const path = join(root, 'public/projects', asset)
      const metadata = await sharp(path).metadata()

      expect(metadata.width).toBe(900)
      expect(metadata.height).toBe(480)
      expect(statSync(path).size).toBeGreaterThan(5_000)
    }
  })
})
