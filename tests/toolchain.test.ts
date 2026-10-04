import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
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
