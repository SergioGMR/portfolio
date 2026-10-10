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

  test('renders only the real indexable routes without fake modification dates', async () => {
    const { INDEXABLE_PATHS, SITE_URL, createSitemapXml } =
      await import('../src/lib/site')
    const xml = createSitemapXml(SITE_URL)

    expect(SITE_URL).toBe('https://sgmr.dev')
    expect(INDEXABLE_PATHS).toHaveLength(14)
    expect(INDEXABLE_PATHS).toContain('/en')
    expect(INDEXABLE_PATHS).toContain('/en/acezone/tos')
    expect(INDEXABLE_PATHS).toContain('/proyectos/jauntjar')
    expect(INDEXABLE_PATHS).toContain('/en/projects/solutec')
    expect(
      Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]),
    ).toEqual(INDEXABLE_PATHS.map((path) => `https://sgmr.dev${path}`))
    expect(xml.match(/<url>/g)).toHaveLength(INDEXABLE_PATHS.length)
    expect(xml).toContain('<loc>https://sgmr.dev/</loc>')
    expect(xml).toContain('<loc>https://sgmr.dev/acezone/tos</loc>')
    expect(xml).toContain('<loc>https://sgmr.dev/wattly/tos</loc>')
    expect(xml).not.toContain('/work')
    expect(xml).not.toContain('<lastmod>')

    const endpoint = readProjectFile('src/pages/sitemap.xml.ts')
    expect(endpoint).toMatch(/from ['"]\.\.\/lib\/site['"]/)
    expect(endpoint).toContain('createSitemapXml(site ?? SITE_URL)')
  })
})
