import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('production analytics guard', () => {
  test('limits the installed adapter analytics script to Vercel production builds', () => {
    const config = readFileSync(
      new URL('../astro.config.ts', import.meta.url),
      'utf8',
    )
    expect(config).toContain("enabled: process.env.VERCEL_ENV === 'production'")
  })
})
