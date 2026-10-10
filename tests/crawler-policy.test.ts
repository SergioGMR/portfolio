import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('crawler policy', () => {
  test('keeps crawler policy while publishing the production sitemap URL', () => {
    const robots = readFileSync(
      new URL('../public/robots.txt', import.meta.url),
      'utf8',
    )

    expect(robots).toContain('Sitemap: https://sgmr.dev/sitemap.xml')
    expect(robots).not.toContain('sergiogmr.vercel.app')
    for (const agent of [
      'Googlebot',
      'bingbot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'Claude-SearchBot',
      'Claude-User',
    ]) {
      expect(robots).toContain(
        `User-agent: ${agent}\nAllow: /\nDisallow: /api/`,
      )
    }
    expect(robots).toContain('User-agent: ClaudeBot\nDisallow: /')
    expect(robots).not.toContain('Crawl-delay')
    expect(robots).toMatch(/User-agent: \*\nAllow: \/\nDisallow: \/api\//)
    for (const agent of [
      'GPTBot',
      'ChatGPT-User',
      'Google-Extended',
      'CCBot',
      'anthropic-ai',
      'Claude-Web',
    ]) {
      expect(robots).toContain(`User-agent: ${agent}`)
    }
  })
})
