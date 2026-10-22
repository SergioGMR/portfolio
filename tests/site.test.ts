import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'bun:test'

const root = join(import.meta.dirname, '..')
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8')

describe('production site discovery', () => {
  test('uses one production origin in Astro configuration', () => {
    const config = readProjectFile('astro.config.ts')

    expect(config).toMatch(/from ['"]\.\/src\/lib\/site['"]/)
    expect(config).toMatch(/site:\s*SITE_URL/)
    expect(config).not.toContain('process.env.CI')
    expect(config).not.toContain('localhost')
  })

  test('redirects the legacy 2024 CV aliases permanently to the canonical PDFs', () => {
    const config = readProjectFile('astro.config.ts')

    for (const locale of ['es', 'en']) {
      expect(config).toMatch(
        new RegExp(
          `'/sergio-morales-2024-${locale}\\.pdf':\\s*\\{\\s*status:\\s*301,\\s*destination:\\s*'/sergio-morales-${locale}\\.pdf'`,
        ),
      )
    }
  })

  test('renders only the real indexable routes with real per-page modification dates', async () => {
    const { INDEXABLE_PATHS, PAGE_LAST_MODIFIED, SITE_URL, createSitemapXml } =
      await import('../src/lib/site')
    const xml = createSitemapXml(SITE_URL)

    expect(SITE_URL).toBe('https://sgmr.dev')
    expect(INDEXABLE_PATHS).toHaveLength(22)
    expect(INDEXABLE_PATHS).toContain('/en')
    expect(INDEXABLE_PATHS).toContain('/en/acezone/tos')
    expect(INDEXABLE_PATHS).toContain('/proyectos/jauntjar')
    expect(INDEXABLE_PATHS).toContain('/en/projects/basuraleza')
    for (const id of [
      'wattly',
      'tvradar',
      'duellum',
      'uploadimg',
      'uploadimg-desktop',
    ] as const) {
      expect(INDEXABLE_PATHS).toContain(`/proyectos/${id}`)
      expect(INDEXABLE_PATHS).toContain(`/en/projects/${id}`)
    }
    expect(INDEXABLE_PATHS).not.toContain('/proyectos/solutec')
    expect(INDEXABLE_PATHS).not.toContain('/en/projects/solutec')
    expect(xml).not.toMatch(/solutec/i)
    expect(
      Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]),
    ).toEqual(INDEXABLE_PATHS.map((path) => `https://sgmr.dev${path}`))
    expect(xml.match(/<url>/g)).toHaveLength(INDEXABLE_PATHS.length)
    expect(xml).toContain('<loc>https://sgmr.dev/</loc>')
    expect(xml).toContain('<loc>https://sgmr.dev/acezone/tos</loc>')
    expect(xml).toContain('<loc>https://sgmr.dev/wattly/tos</loc>')
    expect(xml).not.toContain('/work')
    expect(xml).not.toContain('<changefreq>')
    expect(xml).not.toContain('<priority>')
    expect(
      Array.from(
        xml.matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod><\/url>/g),
        (match) => [match[1], match[2]],
      ),
    ).toEqual(
      INDEXABLE_PATHS.map((path) => [
        `https://sgmr.dev${path}`,
        PAGE_LAST_MODIFIED[path],
      ]),
    )

    const endpoint = readProjectFile('src/pages/sitemap.xml.ts')
    expect(endpoint).toMatch(/from ['"]\.\.\/lib\/site['"]/)
    expect(endpoint).toContain('createSitemapXml(site ?? SITE_URL)')
  })

  test('keeps a real YYYY-MM-DD modification date for exactly the indexable paths', async () => {
    const { INDEXABLE_PATHS, PAGE_LAST_MODIFIED } =
      await import('../src/lib/site')

    expect(Object.keys(PAGE_LAST_MODIFIED).sort()).toEqual(
      [...INDEXABLE_PATHS].sort(),
    )
    for (const date of Object.values(PAGE_LAST_MODIFIED)) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(`${date}T00:00:00Z`))).toBe(false)
      expect(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(
        date,
      )
      expect(Date.parse(`${date}T00:00:00Z`)).toBeLessThanOrEqual(Date.now())
    }
  })

  test('dates pages whose content changed in this work with the implementation date', async () => {
    const { PAGE_LAST_MODIFIED } = await import('../src/lib/site')

    for (const path of [
      '/',
      '/en',
      '/proyectos/jauntjar',
      '/en/projects/jauntjar',
      '/proyectos/todo-lux',
      '/en/projects/todo-lux',
      '/proyectos/basuraleza',
      '/en/projects/basuraleza',
      '/proyectos/wattly',
      '/en/projects/wattly',
      '/proyectos/tvradar',
      '/en/projects/tvradar',
      '/proyectos/duellum',
      '/en/projects/duellum',
      '/proyectos/uploadimg',
      '/en/projects/uploadimg',
      '/proyectos/uploadimg-desktop',
      '/en/projects/uploadimg-desktop',
    ] as const) {
      expect(PAGE_LAST_MODIFIED[path]).toBe('2026-10-22')
    }
    for (const path of [
      '/acezone/tos',
      '/en/acezone/tos',
      '/wattly/tos',
      '/en/wattly/tos',
    ] as const) {
      expect(PAGE_LAST_MODIFIED[path]).toBe('2026-10-11')
    }
  })
})
