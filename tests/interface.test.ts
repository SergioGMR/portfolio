import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

const root = join(import.meta.dirname, '..')
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8')

const index = readProjectFile('src/components/pages/HomePage.astro')
const pageShell = readProjectFile('src/components/layout/PageShell.astro')
const themeToggle = readProjectFile('src/components/ThemeToggleLite.astro')
const languageToggle = readProjectFile(
  'src/components/LanguageToggleLite.astro',
)
const basePage = readProjectFile('src/components/layout/BasePage.astro')
const hero = readProjectFile('src/components/sections/HeroSection.astro')
const skills = readProjectFile('src/components/sections/SkillsSection.astro')
const projects = readProjectFile(
  'src/components/sections/ProjectsSection.astro',
)
const css = readProjectFile('src/styles/globals.css')

describe('portfolio interface', () => {
  test('provides a keyboard skip link with a focusable main target', () => {
    expect(pageShell).toMatch(/href=["']#main-content["']/)
    expect(pageShell).toMatch(
      /<main[^>]*id=["']main-content["'][^>]*tabindex=["']-1["']/s,
    )
  })

  test('keeps focus visible and uses the stable dynamic viewport', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/s)
    expect(css).toMatch(/body\s*\{[^}]*min-height:\s*100dvh/s)
    expect(basePage).toContain('min-h-[100dvh]')
    expect(basePage).not.toContain('min-h-screen')
  })

  test('composes the home as one column in nav order, without the code bento', () => {
    const components = [
      'HeroSection',
      'ProjectsSection',
      'ExperienceSection',
      'EducationLanguagesSection',
      'SkillsSection',
      'FaqSection',
      'AboutContactSection',
    ]
    const positions = components.map((component) =>
      index.indexOf(`<${component}`),
    )

    for (const position of positions) expect(position).toBeGreaterThan(-1)
    // DOM order is nav order: no grid placement or visual reordering remains.
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(index).not.toMatch(
      /\b(?:lg:)?(?:order|col-span|col-start|row-start)-\d/,
    )
    expect(index).not.toContain('grid-cols-')
    expect(index).not.toContain('CodeSnippetBento')
    expect(
      existsSync(join(root, 'src/components/sections/CodeSnippetBento.astro')),
    ).toBe(false)
  })

  test('renders projects as hairline rows and the hero in the display font', () => {
    expect(projects).not.toContain('surface-panel')
    expect(projects).not.toContain('bento-card')
    expect(projects).not.toContain('sm:grid-cols-2')
    expect(projects).toContain('border-t')
    expect(hero).toContain('font-display')
    // Optical size is pinned (no inline style), so headline width scales
    // linearly with size and the metric-matched fallback holds at every width.
    expect(hero).toContain("[font-variation-settings:'opsz'_96]")
    expect(hero).not.toContain('hero-glow')
    expect(hero).not.toContain('text-center')
  })

  test('keeps evidence-backed capabilities instead of an unscoped stack cloud', () => {
    expect(skills).toContain('PROFESSIONAL_PROFILE.capabilities')
    expect(skills).toContain('capability.evidenceIds')
    expect(index).not.toContain('STACK.map')
  })

  test('keeps self-hosted fonts and stable contact and CV destinations', () => {
    expect(basePage).toContain('@fontsource-variable/bricolage-grotesque')
    expect(basePage).toContain('@fontsource-variable/instrument-sans')
    expect(basePage).not.toContain('@fontsource/space-grotesk')
    expect(css).not.toContain('@fontsource/space-grotesk')
    expect(css).not.toContain('Space Grotesk')
    expect(basePage).not.toContain('fonts.googleapis.com')
    expect(hero).toContain('PROFESSIONAL_PROFILE.cvUrls[locale]')
    expect(PROFESSIONAL_PROFILE.cvUrls).toEqual({
      es: '/sergio-morales-es.pdf',
      en: '/sergio-morales-en.pdf',
    })
    expect(PROFESSIONAL_PROFILE.links.mail).toBe(
      'mailto:sergiogmr+portfolio@icloud.com',
    )
    expect(PROFESSIONAL_PROFILE.links.linkedin).toBe(
      'https://www.linkedin.com/in/sergiogmr/',
    )
    expect(PROFESSIONAL_PROFILE.links.github).toBe(
      'https://github.com/sergiogmr',
    )
  })

  test('preloads the Latin variable fonts and declares metric-matched fallbacks', () => {
    expect(basePage).toContain('bricolage-grotesque-latin-opsz-normal.woff2')
    expect(basePage).toContain('instrument-sans-latin-wght-normal.woff2')
    expect(basePage.match(/rel="preload"/g)).toHaveLength(2)
    for (const family of ['Bricolage Grotesque', 'Instrument Sans']) {
      const fallback = new RegExp(
        `@font-face\\s*\\{[^}]*font-family:\\s*'${family} Fallback'[^}]*\\}`,
        's',
      ).exec(css)?.[0]
      expect(fallback, family).toBeDefined()
      for (const descriptor of [
        'size-adjust',
        'ascent-override',
        'descent-override',
        'line-gap-override',
      ])
        expect(fallback, `${family} ${descriptor}`).toContain(`${descriptor}:`)
      expect(fallback).toContain("local('Arial')")
    }
    // The headline wraps differently per language, so each locale has its own
    // size-adjust (calibrated on the real H1 text) and the English page swaps
    // the fallback family in through the lang attribute, without JavaScript.
    const englishFallback =
      /@font-face\s*\{[^}]*font-family:\s*'Bricolage Grotesque Fallback EN'[^}]*\}/s.exec(
        css,
      )?.[0]
    expect(englishFallback).toBeDefined()
    expect(englishFallback).toContain('size-adjust:')
    expect(css).toMatch(
      /html\[lang='en'\]\s+\.font-display\s*\{[^}]*Bricolage Grotesque Fallback EN/s,
    )
    expect(css).toMatch(/--font-display:[^;]*Bricolage Grotesque/)
    expect(css).toMatch(/--font-sans:[^;]*Instrument Sans/)
    expect(css).toMatch(/--font-mono:[^;]*ui-monospace/)
  })

  test('defaults to the system theme in the head script and the toggle', () => {
    expect(basePage).toContain("let savedTheme = 'system'")
    expect(basePage).not.toMatch(/savedTheme = 'dark'/)
    // The system preference is read outside the storage try, so blocked
    // storage still paints the dark system theme before first paint.
    expect(basePage.indexOf('matchMedia')).toBeGreaterThan(
      basePage.indexOf('} catch (_error) {'),
    )
    expect(themeToggle).toContain("let preference: ThemePreference = 'system'")
    expect(themeToggle).toMatch(
      /value === 'light' \|\| value === 'dark' \? value : 'system'/,
    )
  })

  test('shows the section navigation on every viewport in page order', () => {
    const nav = /<nav\s[^>]*data-section-nav[\s\S]*?<\/nav>/.exec(
      pageShell,
    )?.[0]
    expect(nav).toBeDefined()
    expect(nav).not.toMatch(/[\s"']hidden[\s"']/)
    expect(nav).toContain('overflow-x-auto')
    const ids = [...pageShell.matchAll(/sectionLinks[\s\S]*?\]\s*as const/g)]
      .flatMap(([block]) => [...block.matchAll(/id:\s*'([^']+)'/g)])
      .map(([, id]) => id)
    expect(ids).toEqual([
      'proyectos',
      'experiencia',
      'habilidades',
      'preguntas-frecuentes',
      'contacto',
    ])
    expect(pageShell).toContain('aria-current')
    expect(pageShell).toContain('new IntersectionObserver')
    expect(pageShell).toContain('sticky top-0')
  })

  test('sizes every shell control to at least 44px and keeps shell text at 12px or more', () => {
    expect(pageShell).toMatch(
      /data-section-link[^>]*min-h-11|min-h-11[^>]*data-section-link/s,
    )
    expect(themeToggle.match(/min-h-11/g)?.length).toBeGreaterThanOrEqual(2)
    expect(languageToggle).toContain('min-h-11')
    expect(languageToggle).toContain('min-w-11')
    for (const [name, source] of [
      ['PageShell', pageShell],
      ['ThemeToggleLite', themeToggle],
      ['LanguageToggleLite', languageToggle],
    ] as const) {
      expect(source, name).not.toMatch(/text-\[(?:[0-9]|1[01])(?:px|\.\d+px)\]/)
      expect(source, name).not.toMatch(/\bmin-h-(?:8|9|10)\b/)
    }
  })

  test('keeps text contrast at 4.5:1 or better in the light and dark themes', () => {
    const block = (selector: string) =>
      new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    const parse = (source: string) =>
      Object.fromEntries(
        [
          ...source.matchAll(
            /--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g,
          ),
        ].map(([, name, h, s, l]) => [name, [Number(h), Number(s), Number(l)]]),
      ) as Record<string, [number, number, number]>
    const luminance = ([h, s, l]: [number, number, number]) => {
      const sat = s / 100
      const light = l / 100
      const chroma = (1 - Math.abs(2 * light - 1)) * sat
      const channel = (n: number) => {
        const k = (n + h / 30) % 12
        const value =
          light - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
        return value <= 0.03928
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4)
    }
    const contrast = (
      a: [number, number, number],
      b: [number, number, number],
    ) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return (hi! + 0.05) / (lo! + 0.05)
    }
    const light = parse(block(':root'))
    const dark = { ...light, ...parse(block('\\.dark')) }
    for (const [theme, tokens] of [
      ['light', light],
      ['dark', dark],
    ] as const) {
      for (const [text, surface] of [
        ['foreground', 'background'],
        ['muted-foreground', 'background'],
        ['muted-foreground', 'muted'],
        ['muted-foreground', 'surface'],
        ['primary', 'background'],
        ['primary', 'muted'],
        ['primary-foreground', 'primary'],
        ['success', 'background'],
      ] as const)
        expect(
          contrast(tokens[text]!, tokens[surface]!),
          `${theme}: ${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5)
    }
    expect(css).toMatch(/--radius:\s*0(?:px|rem)?\s*;/)
  })
})
