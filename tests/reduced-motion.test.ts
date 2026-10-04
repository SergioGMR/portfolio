// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8')

const css = readProjectFile('src/styles/globals.css')

const extractReducedMotionRule = () => {
  const mediaStart = css.indexOf('@media (prefers-reduced-motion: reduce)')
  const blockStart = css.indexOf('{', mediaStart)
  if (mediaStart < 0 || blockStart < 0) {
    throw new Error('Reduced-motion media query is missing')
  }

  let depth = 1
  let cursor = blockStart + 1
  while (depth > 0 && cursor < css.length) {
    if (css[cursor] === '{') depth += 1
    if (css[cursor] === '}') depth -= 1
    cursor += 1
  }

  const block = css.slice(blockStart + 1, cursor - 1)
  const rule = block.match(/^\s*([^{}]+)\{([^{}]+)\}/)
  if (!rule) throw new Error('Reduced-motion style rule is missing')

  return {
    mediaStart,
    selectors: rule[1].split(',').map((selector) => selector.trim()),
    declarations: rule[2],
  }
}

const directAnimationClasses = () => {
  const sources = [
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/components/layout/PageShell.astro'),
  ]
  const classes = sources.flatMap((source) =>
    [...source.matchAll(/\bclass="([^"]+)"/g)].flatMap((match) =>
      match[1].split(/\s+/),
    ),
  )

  return [...new Set(classes)].filter(
    (className) =>
      /(?:^|:)animate-/.test(className) &&
      !/(?:^|:)animate-delay-/.test(className),
  )
}

describe('reduced motion', () => {
  it('selects every direct hero animation and the decorative pulse', () => {
    const { mediaStart, selectors } = extractReducedMotionRule()
    const classes = directAnimationClasses()

    expect(classes).toEqual([
      'animate-fade-in-down',
      'animate-blurred-fade-in',
      'animate-fade-in-up',
      'animate-fade-in',
      'md:animate-slide-in-right',
      'animate-ping',
    ])
    expect(mediaStart).toBeGreaterThan(
      css.indexOf("@import '@midudev/tailwind-animations'"),
    )

    for (const className of classes) {
      const element = document.createElement('div')
      element.className = className
      expect(selectors.some((selector) => element.matches(selector))).toBe(true)
    }
  })

  it('removes animation and reveal transforms with cascade-safe overrides', () => {
    const { declarations, selectors } = extractReducedMotionRule()
    const observerElement = document.createElement('div')
    observerElement.dataset.animate = 'animate-fade-in'

    expect(
      selectors.some((selector) => observerElement.matches(selector)),
    ).toBe(true)
    expect(declarations).toMatch(/animation:\s*none\s*!important/)
    expect(declarations).toMatch(/opacity:\s*1\s*!important/)
    expect(declarations).toMatch(/transform:\s*none\s*!important/)
  })
})
