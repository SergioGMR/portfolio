import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

const root = join(import.meta.dirname, '..')
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8')

const index = readProjectFile('src/pages/index.astro')
const pageShell = readProjectFile('src/components/layout/PageShell.astro')
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

  test('preserves the current section architecture and mobile-first order', () => {
    for (const component of [
      'HeroSection',
      'ProjectsSection',
      'CodeSnippetBento',
      'ExperienceSection',
      'SkillsSection',
      'EducationLanguagesSection',
      'AboutContactSection',
    ]) {
      expect(index).toContain(`<${component}`)
    }

    expect(index).toContain('order-1')
    expect(index).toContain('order-5')
    expect(projects).toContain('surface-panel')
    expect(projects).toContain('sm:grid-cols-2')
  })

  test('keeps evidence-backed capabilities instead of an unscoped stack cloud', () => {
    expect(skills).toContain('PROFESSIONAL_PROFILE.capabilities')
    expect(skills).toContain('capability.evidenceIds')
    expect(index).not.toContain('STACK.map')
  })

  test('keeps self-hosted fonts and stable contact and CV destinations', () => {
    expect(basePage).toContain('@fontsource/space-grotesk')
    expect(basePage).not.toContain('fonts.googleapis.com')
    expect(hero).toContain('PROFESSIONAL_PROFILE.cvUrls.es')
    expect(hero).toContain('PROFESSIONAL_PROFILE.cvUrls.en')
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
})
