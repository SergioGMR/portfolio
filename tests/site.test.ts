import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8')

describe('production site discovery', () => {
  it('uses one production origin in Astro configuration', () => {
    const config = readProjectFile('astro.config.ts')

    expect(config).toMatch(/from ['"]\.\/src\/lib\/site['"]/)
    expect(config).toMatch(/site:\s*SITE_URL/)
    expect(config).not.toContain('process.env.CI')
    expect(config).not.toContain('localhost')
  })

  it('renders only the real indexable routes without fake modification dates', async () => {
    const { INDEXABLE_PATHS, SITE_URL, createSitemapXml } =
      await import('../src/lib/site')
    const xml = createSitemapXml(SITE_URL)

    expect(INDEXABLE_PATHS).toEqual(['/', '/acezone/tos/', '/wattly/tos/'])
    expect(xml.match(/<url>/g)).toHaveLength(INDEXABLE_PATHS.length)
    expect(xml).toContain('<loc>https://sgmr.dev/</loc>')
    expect(xml).toContain('<loc>https://sgmr.dev/acezone/tos/</loc>')
    expect(xml).toContain('<loc>https://sgmr.dev/wattly/tos/</loc>')
    expect(xml).not.toContain('/work')
    expect(xml).not.toContain('<lastmod>')

    const endpoint = readProjectFile('src/pages/sitemap.xml.ts')
    expect(endpoint).toMatch(/from ['"]\.\.\/lib\/site['"]/)
    expect(endpoint).toContain('createSitemapXml(site ?? SITE_URL)')
  })

  it('keeps crawler policy while publishing the production sitemap URL', () => {
    const robots = readProjectFile('public/robots.txt')

    expect(robots).toContain('Sitemap: https://sgmr.dev/sitemap.xml')
    expect(robots).not.toContain('sergiogmr.vercel.app')
    expect(robots).toMatch(/User-agent: \*\nAllow: \/\nDisallow: \/api\//)
    for (const agent of [
      'GPTBot',
      'ChatGPT-User',
      'Google-Extended',
      'CCBot',
      'anthropic-ai',
      'Claude-Web',
    ]) {
      expect(robots).toContain(`User-agent: ${agent}`)
    }
  })
})
