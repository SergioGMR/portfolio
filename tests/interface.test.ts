import { describe, expect, test } from 'bun:test'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
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
const lowerSections = {
  ExperienceSection: readProjectFile(
    'src/components/sections/ExperienceSection.astro',
  ),
  EducationLanguagesSection: readProjectFile(
    'src/components/sections/EducationLanguagesSection.astro',
  ),
  SkillsSection: skills,
  FaqSection: readProjectFile('src/components/sections/FaqSection.astro'),
  AboutContactSection: readProjectFile(
    'src/components/sections/AboutContactSection.astro',
  ),
}
const projects = readProjectFile(
  'src/components/sections/ProjectsSection.astro',
)
const css = readProjectFile('src/styles/globals.css')
const legalCss = readProjectFile('src/styles/legal-content.css')
const caseStudy = readProjectFile('src/components/pages/CaseStudyPage.astro')

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
        ['accent', 'background'],
        ['accent-foreground', 'accent'],
        ['success', 'background'],
      ] as const)
        expect(
          contrast(tokens[text]!, tokens[surface]!),
          `${theme}: ${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5)
    }
    expect(css).toMatch(/--radius:\s*0(?:px|rem)?\s*;/)
  })
  test('renders the lower sections as hairline ledgers, numbered like the nav', () => {
    for (const [name, source] of Object.entries(lowerSections)) {
      // No cards, panels, pills, rounded corners or text under 12px.
      expect(source, name).not.toMatch(
        /bento-card|surface-panel|tech-tag|rounded-|tracking-\[0\.3em\]/,
      )
      expect(source, name).not.toMatch(/text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/)
    }
    // Education and Languages sit between 02 and 03 without a nav number.
    const numbered = [
      ['ExperienceSection', '02'],
      ['SkillsSection', '03'],
      ['FaqSection', '04'],
      ['AboutContactSection', '05'],
    ] as const
    for (const [name, number] of numbered) {
      const source = lowerSections[name]
      expect(source, name).toContain('data-section-number')
      expect(source, name).toMatch(new RegExp(`>\\s*${number}\\s*<`))
      expect(source, name).toContain('font-display')
    }
    expect(lowerSections.EducationLanguagesSection).not.toContain(
      'data-section-number',
    )
  })

  test('renders the case study, legal pages and 404 in the index vocabulary', () => {
    const pages = {
      CaseStudyPage: caseStudy,
      AceZoneTerms: readProjectFile('src/components/pages/AceZoneTerms.astro'),
      WattlyTerms: readProjectFile('src/components/pages/WattlyTerms.astro'),
      '404': readProjectFile('src/pages/404.astro'),
    }
    for (const [name, source] of Object.entries(pages)) {
      // No panels, frames, pills, rounded corners, shadows or blur.
      expect(source, name).not.toMatch(
        /surface-panel|media-frame|tech-tag|bento-card|rounded|shadow-|backdrop-/,
      )
      expect(source, name).not.toMatch(/text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/)
      expect(source, name).not.toContain('style=')
    }
    // The case study reads like the home rows: display type, mono labels, and
    // body prose capped near 70 characters per line.
    expect(caseStudy).toContain('font-display')
    expect(caseStudy).toContain("[font-variation-settings:'opsz'_96]")
    expect(caseStudy).toContain('max-w-[48ch]')
    expect(caseStudy).toContain('data-case-nav')
    expect(caseStudy).toContain('data-section-number')
    expect(caseStudy).not.toContain('tracking-[0.2em]')
    // Legal headings use the display face from the stylesheet, not inline.
    expect(legalCss).toMatch(
      /\.prose-tos h1\s*\{[^}]*font-family:\s*var\(--font-display\)/s,
    )
  })

  test('keeps the removed panel utilities out of the stylesheet source', () => {
    for (const removed of ['surface-panel', 'media-frame', 'tech-tag'])
      expect(css).not.toContain(`.${removed}`)
  })

  test('hides the decorative arrows of the experience links from their names', () => {
    const source = lowerSections.ExperienceSection
    expect(source).not.toMatch(/>\s*LinkedIn ↗\s*</)
    expect(source.match(/<span aria-hidden="true">↗<\/span>/g)).toHaveLength(2)
  })

  test('removes the hero desktop top padding', () => {
    expect(hero).not.toContain('lg:pt-16')
    expect(hero).toMatch(/<section id="inicio" class="[^"]*\blg:pt-0\b/)
  })

  test('fades and pads the mobile section nav only below lg', () => {
    const nav = /<nav\s[^>]*data-section-nav[\s\S]*?>/.exec(pageShell)?.[0]
    expect(nav).toBeDefined()
    expect(nav).toContain('gap-5')
    expect(nav).not.toMatch(/(^|[\s"'])gap-6/)
    expect(nav).toContain('pr-12')
    expect(nav).toContain('lg:pr-0')
    expect(nav).toContain(
      '[mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)]',
    )
    expect(nav).toContain('lg:[mask-image:none]')
    // Keyboard focus lifts the fade so the focused link and its ring stay fully
    // visible even when the browser does not scroll it.
    expect(nav).toContain('has-[a:focus-visible]:[mask-image:none]')
    expect(nav).not.toContain('style=')
  })

  test('scans only src/ for Tailwind classes and prunes unused utilities', () => {
    expect(css).toMatch(/^@import 'tailwindcss' source\('\.\.'\);/)
    const utilities =
      /@layer utilities\s*\{([\s\S]*?)\n\}\n/.exec(css)?.[1] ?? ''
    const names = [
      ...utilities.matchAll(/^ {2}\.([a-z][a-z-]*)\s*[{,:]/gm),
    ].map(([, name]) => name!)
    expect(names.length).toBeGreaterThan(0)
    const sources = readdirSync(join(root, 'src'), { recursive: true })
      .map(String)
      .filter((file) => /\.(?:astro|ts)$/.test(file))
      .map((file) => readProjectFile(`src/${file}`))
      .join('\n')
    for (const name of new Set(names))
      expect(sources, `.${name} is unused in src/`).toMatch(
        new RegExp(`(^|[^\\w-])${name}([^\\w-]|$)`),
      )
    for (const removed of [
      'bento-card',
      'code-panel',
      'hero-glow',
      'status-dot',
      'result-card',
    ])
      expect(css).not.toContain(`.${removed}`)
  })

  test('sets every corner radius to 0 and keeps the accent blue in both themes', () => {
    const theme = /@theme\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ''
    const radii = [...theme.matchAll(/--radius-([a-z0-9]+):\s*([^;]+);/g)]
    expect(radii.map(([, size]) => size)).toEqual([
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      '4xl',
    ])
    for (const [, size, value] of radii)
      expect(value!.trim(), `--radius-${size}`).toMatch(/^0(?:px|rem)?$/)
    const block = (selector: string) =>
      new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    const accent = (selector: string) =>
      /--accent:\s*(\d+)\s/.exec(block(selector))?.[1]
    expect(accent(':root')).toBe('217')
    expect(accent('\\.dark')).toBe('217')
  })
})
