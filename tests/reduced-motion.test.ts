import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8')
const css = readProjectFile('src/styles/globals.css')
const pageShell = readProjectFile('src/components/layout/PageShell.astro')

describe('reduced motion', () => {
  test('disables direct animation and keeps revealed content visible', () => {
    const mediaStart = css.indexOf('@media (prefers-reduced-motion: reduce)')
    expect(mediaStart).toBeGreaterThan(-1)

    const reducedRule = css.slice(mediaStart)
    expect(reducedRule).toMatch(/\*,\s*\*::before,\s*\*::after\s*\{/s)
    expect(reducedRule).toMatch(/animation:\s*none\s*!important/)
    expect(reducedRule).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
    expect(reducedRule).toMatch(
      /\[data-animate\][^{]*\{[^}]*opacity:\s*1\s*!important/s,
    )
    expect(reducedRule).toMatch(
      /\[data-animate\][^{]*\{[^}]*transform:\s*none\s*!important/s,
    )
  })

  test('reveals observer content immediately for reduced-motion users', () => {
    expect(pageShell).toContain("'(prefers-reduced-motion: reduce)'")
    expect(pageShell).toContain("element.classList.add('is-visible')")
    expect(pageShell).toContain("!('IntersectionObserver' in window)")
  })
})
