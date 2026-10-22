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
      'Google-Extended',
    ]) {
      expect(robots).toContain(
        `User-agent: ${agent}\nAllow: /\nDisallow: /api/`,
      )
    }
    expect(robots).not.toContain('Crawl-delay')
    expect(robots).toMatch(/User-agent: \*\nAllow: \/\nDisallow: \/api\//)
    for (const agent of [
      'GPTBot',
      'CCBot',
      'ClaudeBot',
      'anthropic-ai',
      'Claude-Web',
      'Omgilibot',
      'FacebookBot',
    ]) {
      expect(robots).toContain(`User-agent: ${agent}\nDisallow: /\n`)
    }
    expect(robots).not.toContain('User-agent: Google-Extended\nDisallow: /\n')
    const optOutBlock = robots.slice(robots.indexOf('# Training opt-outs'))
    expect(optOutBlock).not.toContain('Google-Extended')
  })
})
