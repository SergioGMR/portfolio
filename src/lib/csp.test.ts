import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

import {
  type CspHash,
  collectInlineScriptHashes,
  extractInlineScripts,
  hashCspSource,
} from './csp'

const componentsRoot = new URL('../components/', import.meta.url)
const sha256 = (content: string): CspHash =>
  `sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}`

describe('hashCspSource', () => {
  test('hashes the exact bytes with SHA-256 in base64, as browsers do', () => {
    expect(hashCspSource('alert(1)')).toBe(sha256('alert(1)'))
    expect(hashCspSource('alert(1) ')).not.toBe(hashCspSource('alert(1)'))
    expect(hashCspSource('é')).toBe(sha256('é'))
  })
})

describe('extractInlineScripts', () => {
  test('returns the raw body of every is:inline script, whitespace included', () => {
    const source = `---\nconst a = 1\n---\n<script is:inline>\n  one()\n</script>\n<div />\n<script is:inline>two()</script>`
    expect(extractInlineScripts(source)).toEqual(['\n  one()\n', 'two()'])
  })

  test('ignores bundled scripts, external scripts and JSON-LD data blocks', () => {
    const source = [
      '<script>import "./x"</script>',
      '<script is:inline src="/x.js"></script>',
      '<script type="application/ld+json" set:html={json} />',
      '<script type="module">bundled()</script>',
    ].join('\n')
    expect(extractInlineScripts(source)).toEqual([])
  })

  test('normalizes CRLF and lone CR to LF, as browsers and the Astro compiler emit', () => {
    const lf = '<script is:inline>\n  one()\n  two()\n</script>'
    const crlf = lf.replace(/\n/g, '\r\n')
    const cr = lf.replace(/\n/g, '\r')
    expect(extractInlineScripts(crlf)).toEqual(['\n  one()\n  two()\n'])
    expect(extractInlineScripts(cr)).toEqual(extractInlineScripts(lf))
    expect(hashCspSource(extractInlineScripts(crlf)[0]!)).toBe(
      hashCspSource(extractInlineScripts(lf)[0]!),
    )
  })

  test('accepts the directive in any attribute position', () => {
    const source = '<script type="module" is:inline>mod()</script>'
    expect(extractInlineScripts(source)).toEqual(['mod()'])
  })
})

describe('collectInlineScriptHashes', () => {
  const hashes = collectInlineScriptHashes(componentsRoot)

  test('covers the theme bootstrap and the reveal-animation scripts', () => {
    for (const file of ['layout/BasePage.astro', 'layout/PageShell.astro']) {
      const bodies = extractInlineScripts(
        readFileSync(new URL(file, componentsRoot), 'utf8'),
      )
      expect(bodies).toHaveLength(1)
      expect(hashes).toContain(sha256(bodies[0]!))
    }
  })

  test('returns sorted, unique hashes in the CSP source-list format', () => {
    expect(hashes.length).toBeGreaterThanOrEqual(2)
    expect(new Set(hashes).size).toBe(hashes.length)
    expect([...hashes].sort()).toEqual(hashes)
    for (const hash of hashes) expect(hash).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/)
  })
})
