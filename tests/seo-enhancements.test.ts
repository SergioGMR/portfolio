import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { getAlternatePaths, getLanguage } from '../src/lib/site'

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('bilingual URL contract', () => {
  for (const [spanish, english] of [
    ['/', '/en'],
    ['/acezone/tos', '/en/acezone/tos'],
    ['/wattly/tos', '/en/wattly/tos'],
    ...['jauntjar', 'todo-lux', 'basuraleza'].map((id) => [
      `/proyectos/${id}`,
      `/en/projects/${id}`,
    ]),
  ]) {
    test(`uses reciprocal routes ${spanish} and ${english}`, () => {
      expect(getAlternatePaths(spanish!)).toEqual({ es: spanish, en: english })
      expect(getAlternatePaths(english!)).toEqual({ es: spanish, en: english })
      expect(getLanguage(spanish!)).toBe('es')
      expect(getLanguage(english!)).toBe('en')
    })
  }
  test('does not confuse similarly named routes with English', () => {
    expect(getLanguage('/engineering')).toBe('es')
  })
})

describe('project discovery and social card', () => {
  test('home links to internal case studies while retaining showcase demos', () => {
    const source = read('src/components/sections/ProjectsSection.astro')
    expect(source).toContain('getAlternatePaths')
    expect(source).toContain('`/proyectos/${project.id}`')
    expect(source).toContain('project.evidenceUrl')
  })
  test('social card is an actual JPEG at the declared native dimensions', async () => {
    const metadata = await sharp(
      new URL('../public/og.jpg', import.meta.url).pathname,
    ).metadata()
    expect(metadata.format).toBe('jpeg')
    expect(metadata.width).toBe(1200)
    expect(metadata.height).toBe(630)
  })
})

describe('local hosting configuration', () => {
  test('preserves header policy and declares a permanent www-to-apex redirect with path captures', () => {
    const config = JSON.parse(read('vercel.json'))
    expect(config.trailingSlash).toBe(false)
    expect(read('astro.config.ts')).toContain("trailingSlash: 'never'")
    expect(config.redirects).toEqual([
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.sgmr.dev' }],
        destination: 'https://sgmr.dev/:path*',
        permanent: true,
      },
    ])
    expect(config.headers).toHaveLength(2)
    expect(config.headers[1].headers).toContainEqual({
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    })
  })
})
