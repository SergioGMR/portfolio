import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

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
) as {
  compilerOptions?: { moduleResolution?: string }
}
const workflow = readFileSync(
  join(root, '.github/workflows/autofix.yml'),
  'utf8',
)

describe('project toolchain', () => {
  it('pins the Bun-compatible quality toolchain', () => {
    expect(packageJson.packageManager).toBe('bun@1.4.2')
    expect(packageJson.engines?.node).toBe('>=22.12.0')
    expect(packageJson.scripts).toMatchObject({
      check: 'astro check',
      'format:check':
        'prettier --check "src/**/*.{astro,ts,css}" "tests/**/*.ts" "package.json" "astro.config.ts" ".github/workflows/*.yml" --cache',
      test: 'vitest run',
    })
    expect(packageJson.devDependencies).toMatchObject({
      '@astrojs/check': '0.9.10',
      'happy-dom': '20.14.5',
      vitest: '5.0.3',
    })
  })

  it('uses the supported Astro 7 dependency graph', () => {
    expect(packageJson.dependencies).toEqual({
      '@astrojs/vercel': '11.0.11',
      '@midudev/tailwind-animations': '^1.0.2',
      '@tailwindcss/postcss': '^4.3.3',
      '@tailwindcss/vite': '^4.3.3',
      astro: '7.3.5',
      sharp: '^0.35.5',
      tailwindcss: '^4.3.3',
      vite: '^8.3.2',
    })
    expect(packageJson.devDependencies).toEqual({
      '@astrojs/check': '0.9.10',
      '@types/node': '^24.19.1',
      'happy-dom': '20.14.5',
      prettier: '^3.9.9',
      'prettier-plugin-astro': '^1.1.0',
      'prettier-plugin-tailwindcss': '^0.8.1',
      typescript: '^6.0.3',
      vitest: '5.0.3',
    })
  })

  it('resolves Astro package exports with the bundler strategy', () => {
    expect(tsconfig.compilerOptions?.moduleResolution).toBe('bundler')
  })

  it('runs deterministic CI gates with Bun in dependency order', () => {
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
    ]
    const positions = commands.map((command) => workflow.indexOf(command))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual(
      [...positions].sort((left, right) => left - right),
    )
  })
})
