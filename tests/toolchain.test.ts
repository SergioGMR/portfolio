import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const packageJson = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
) as {
  engines?: { node?: string }
  packageManager?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
const tsconfig = JSON.parse(
  readFileSync(join(root, 'tsconfig.json'), 'utf8'),
) as { compilerOptions?: { moduleResolution?: string } }
const workflow = readFileSync(
  join(root, '.github/workflows/autofix.yml'),
  'utf8',
)

describe('project toolchain', () => {
  test('pins one Bun-native quality toolchain', () => {
    expect(packageJson.packageManager).toBe('bun@1.4.2')
    expect(packageJson.engines?.node).toBe('>=22.12.0')
    expect(packageJson.scripts).toMatchObject({
      build: 'astro build && bun run verify:output',
      check: 'astro check',
      'format:check':
        'prettier --check "src/**/*.{astro,ts,css}" "scripts/**/*.ts" "tests/**/*.ts" "package.json" "astro.config.ts" ".lighthouserc.cjs" ".github/workflows/*.yml" --cache',
      'lighthouse:ci': 'bun run build && lhci autorun',
      test: 'bun test',
      'verify:output': 'bun scripts/verify-portfolio-output.ts',
    })
    expect(packageJson.devDependencies).toMatchObject({
      '@astrojs/check': '0.9.10',
      '@lhci/cli': '0.15.1',
      '@types/bun': '^1.3.14',
      'happy-dom': '20.14.5',
      typescript: '^6.0.3',
    })
    expect(packageJson.devDependencies).not.toHaveProperty('vitest')
  })

  test('uses the compatible Astro 7 graph without losing current-main dependencies', () => {
    expect(packageJson.dependencies).toMatchObject({
      '@astrojs/vercel': '11.0.11',
      '@fontsource/space-grotesk': '^5.3.0',
      '@tailwindcss/postcss': '^4.3.3',
      '@tailwindcss/vite': '^4.3.3',
      astro: '7.3.5',
      sharp: '^0.35.5',
      tailwindcss: '^4.3.3',
      vite: '^8.3.2',
    })
  })

  test('resolves Astro package exports with the bundler strategy', () => {
    expect(tsconfig.compilerOptions?.moduleResolution).toBe('bundler')
  })

  test('runs deterministic CI gates with Bun in dependency order', () => {
    expect(workflow).toContain('uses: oven-sh/setup-bun@v2')
    expect(workflow).toContain('bun-version: 1.4.2')
    expect(workflow).not.toMatch(/\bpnpm\b/)
    expect(workflow).not.toContain('prettier -w')
    expect(workflow).not.toContain('autofix-ci/action')

    const commands = [
      'run: bun ci',
      'run: bun run format:check',
      'run: bun run check',
      'run: bun run test',
      'run: bun run build',
      'run: bun run lighthouse:ci',
    ]
    const positions = commands.map((command) => workflow.indexOf(command))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual(
      [...positions].sort((left, right) => left - right),
    )
  })
})

// Floors cover the compatible advisory fixes; registry audit remains the gate
// for newly published advisories and the separately documented blocked parents.
describe('compatible dependency advisory fixes', () => {
  const lock = Bun.JSONC.parse(
    readFileSync(join(root, 'bun.lock'), 'utf8'),
  ) as { packages: Record<string, [string, ...unknown[]]> }
  const safeRanges: [string, string][] = [
    ['brace-expansion', '^1.1.21 || ^5.0.12'],
    ['devalue', '^5.9.3'],
    ['http-cache-semantics', '^4.3.0'],
    ['ip-address', '^10.7.1'],
    ['js-yaml', '^3.15.2 || ^4.3.0'],
    ['nanoid', '^3.3.18 || ^5.1.0'],
    ['picomatch', '^2.3.2 || ^4.0.4'],
    ['tar', '^7.5.21'],
  ]

  test.each(safeRanges)(
    '%s stays above known patched floors',
    (name, range) => {
      const versions = Object.values(lock.packages)
        .map(([resolved]) => resolved)
        .filter((resolved) => resolved.startsWith(`${name}@`))
        .map((resolved) => resolved.slice(name.length + 1))

      expect(versions.length).toBeGreaterThan(0)
      for (const version of versions) {
        expect(Bun.semver.satisfies(version, range)).toBe(true)
      }
    },
  )
})

describe('parent-scoped Vercel routing patch', () => {
  const require = createRequire(import.meta.url)
  const routingRequire = createRequire(require.resolve('@vercel/routing-utils'))
  const expressRequire = createRequire(require.resolve('express'))
  const routing = require('@vercel/routing-utils')

  test("patches the Vercel parser without changing Express's 0.1 API", () => {
    expect(routingRequire('path-to-regexp/package.json').version).toBe('6.3.0')
    expect(expressRequire('path-to-regexp/package.json').version).toBe('0.1.13')
  })

  test.each([
    ['/', '/', '/missing'],
    ['/acezone/tos', '/acezone/tos', '/acezone/tos/'],
    ['/wattly/tos', '/wattly/tos', '/wattly/tos/'],
    ['/_astro/:path*', '/_astro/project.avif', '/other/project.avif'],
  ])('preserves route matching for %s', (source, allowed, rejected) => {
    const { src } = routing.sourceToRegex(source)
    const matcher = new RegExp(src)
    expect(matcher.test(allowed)).toBe(true)
    expect(matcher.test(rejected)).toBe(false)
  })

  test('preserves named rewrite captures and destination compilation', () => {
    const [rewrite] = routing.convertRewrites([
      { source: '/legacy/:page', destination: '/:page' },
    ])
    expect(rewrite.dest).toBe('/$1')
    expect(new RegExp(rewrite.src).exec('/legacy/wattly')?.[1]).toBe('wattly')
    expect(routing.compilePathToRegexpTemplate('/legacy/:page', '/:page')).toBe(
      '/$1',
    )
  })
})

describe('compatible query-parser parent refresh', () => {
  const require = createRequire(import.meta.url)

  for (const parent of ['express', 'body-parser']) {
    const parentRequire = createRequire(require.resolve(parent))
    const qs = parentRequire('qs')

    test(`${parent} resolves the patched 6.x query parser`, () => {
      expect(parentRequire('qs/package.json').version).toBe('6.16.0')
    })

    test(`${parent} preserves normal nested, array, and encoded parsing`, () => {
      expect(
        qs.parse(
          'language=en&projects[]=wattly&projects[]=tvradar&profile[name]=Sergio%20GMR',
        ),
      ).toEqual({
        language: 'en',
        projects: ['wattly', 'tvradar'],
        profile: { name: 'Sergio GMR' },
      })
    })
  }
})
