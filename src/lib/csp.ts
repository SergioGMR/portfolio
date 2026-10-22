import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'

export type CspHash = `sha256-${string}`

/**
 * Astro hashes the scripts it processes, but never an `is:inline` script
 * (Astro leaves those untouched). Those bodies are hashed here from their
 * source so the CSP can allow exactly them. The verifier re-checks the built
 * HTML, so a compiler change that alters the emitted bytes fails the build
 * instead of silently blocking the script in browsers.
 */
export function hashCspSource(content: string): CspHash {
  return `sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}`
}

// HTML turns CRLF and lone CR into LF while parsing, and so does the Astro
// compiler, so a hash over the raw CRLF bytes would never match what runs.
const LINE_BREAKS = /\r\n?/g
const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g

export function extractInlineScripts(astroSource: string): string[] {
  const bodies: string[] = []
  for (const [, attributes = '', body = ''] of astroSource.matchAll(
    INLINE_SCRIPT,
  )) {
    if (
      /(?:^|\s)is:inline(?=\s|$)/.test(attributes) &&
      !/\ssrc=/.test(attributes)
    )
      bodies.push(body.replace(LINE_BREAKS, '\n'))
  }
  return bodies
}

export function collectInlineScriptHashes(componentsRoot: URL): CspHash[] {
  const hashes = new Set<CspHash>()
  for (const entry of readdirSync(componentsRoot, { recursive: true })) {
    if (!String(entry).endsWith('.astro')) continue
    const source = readFileSync(new URL(String(entry), componentsRoot), 'utf8')
    for (const body of extractInlineScripts(source))
      hashes.add(hashCspSource(body))
  }
  return [...hashes].sort()
}
