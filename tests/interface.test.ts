import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8')

const index = readProjectFile('src/pages/index.astro')
const pageShell = readProjectFile('src/components/layout/PageShell.astro')
const basePage = readProjectFile('src/components/layout/BasePage.astro')
const css = readProjectFile('src/styles/globals.css')

describe('portfolio interface', () => {
  it('provides a keyboard skip link with a focusable main target', () => {
    expect(pageShell).toMatch(/href=["']#main-content["']/)
    expect(pageShell).toMatch(
      /<main[^>]*id=["']main-content["'][^>]*tabindex=["']-1["']/,
    )
  })

  it('keeps focus visible and uses the stable dynamic viewport', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/s)
    expect(css).toMatch(/body\s*\{[^}]*min-height:\s*100dvh/s)
    expect(basePage).not.toContain('min-h-screen')
  })

  it('removes decorative hero, badge, chip-strip, and status UI', () => {
    expect(index).not.toContain('blur-3xl')
    expect(index).not.toMatch(
      /\['PHP',\s*'Laravel',\s*'TypeScript',\s*'React',\s*'Tailwind'\]\.map/,
    )
    expect(index).not.toContain("idx === 0 ? 'Actual' : 'Freelance'")
    expect(index).not.toContain("idx === 0 ? 'Current' : 'Freelance'")
    expect(index).not.toContain("idx === 0 ? 'Live' : 'Project'")
    expect(pageShell).not.toContain('animate-ping')
    expect(pageShell).not.toContain('bg-green-500')
  })

  it('uses grouped skills instead of an undifferentiated technology cloud', () => {
    expect(index).not.toMatch(/import\s*\{[^}]*\bSTACK\b/)
    expect(index).not.toContain('STACK.map')
    expect(index).toContain('skillGroups')
    expect(index).toContain('data-skill-group')
  })

  it('keeps factual imagery and existing contact and CV destinations', () => {
    for (const asset of [
      'me_laptop.webp',
      'todo-lux.webp',
      'basuraleza.webp',
      'solutec.webp',
      'tcatik.webp',
    ]) {
      expect(index).toContain(asset)
    }

    expect(`${index}\n${pageShell}`).toContain(
      'mailto:sergiogmr+portfolio@icloud.com',
    )
    expect(index).toContain('/sergio-morales-2024-es.pdf')
    expect(index).toContain('/sergio-morales-2024-en.pdf')
    expect(`${index}\n${pageShell}`).toContain(
      'https://www.linkedin.com/in/sergiogmr',
    )
    expect(`${index}\n${pageShell}`).toContain('https://github.com/sergiogmr')
  })

  it('uses one bilingual contact intent and no decorative dash separators', () => {
    const source = `${index}\n${pageShell}`

    expect(source).not.toMatch(/Hablemos|Let's talk|Escríbeme|Email me/)
    expect(source).toContain('Contacto')
    expect(source).toContain('Contact')
    expect(source).not.toMatch(/[—–]/)
  })
})
