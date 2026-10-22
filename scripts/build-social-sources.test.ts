import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, statSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import {
  SOCIAL_INPUTS,
  SOCIAL_SIZE,
  SOCIAL_SOURCES,
  buildSocialSource,
} from './build-social-sources'

const root = new URL('../', import.meta.url)
const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  )
})

describe('social card sources', () => {
  test('are 1200x630 as the Open Graph card requires', () => {
    expect(SOCIAL_SIZE).toEqual({ width: 1200, height: 630 })
    expect([...SOCIAL_SOURCES]).toEqual([
      'todo-lux',
      'basuraleza',
      'wattly',
      'tvradar',
      'duellum',
      'uploadimg',
      'uploadimg-desktop',
    ])
  })

  test('reads the 900x480 page image of each project', () => {
    expect(SOCIAL_INPUTS).toEqual({
      'todo-lux': 'src/assets/experience/todo-lux.avif',
      basuraleza: 'src/assets/experience/basuraleza.avif',
      wattly: 'src/assets/projects/wattly.webp',
      tvradar: 'src/assets/projects/tvradar.webp',
      duellum: 'src/assets/projects/duellum.webp',
      uploadimg: 'src/assets/projects/uploadimg.webp',
      'uploadimg-desktop': 'src/assets/projects/uploadimg-desktop.webp',
    })
  })

  for (const id of SOCIAL_SOURCES) {
    test(`ships a committed 1200x630 PNG for ${id}`, async () => {
      const file = new URL(`src/assets/social/${id}.png`, root)
      expect(existsSync(file)).toBe(true)
      const metadata = await sharp(fileURLToPath(file)).metadata()
      expect(metadata.format).toBe('png')
      expect(metadata.width).toBe(1200)
      expect(metadata.height).toBe(630)
      // Keeps the repository light: well under 1.5 MB per card.
      expect(statSync(file).size).toBeGreaterThan(10_000)
      expect(statSync(file).size).toBeLessThan(1_500_000)
    })

    test(`rebuilds ${id} from its 900x480 page image, deterministically`, async () => {
      const source = new URL(SOCIAL_INPUTS[id], root)
      expect((await sharp(fileURLToPath(source)).metadata()).width).toBe(900)
      const dir = await mkdtemp(join(tmpdir(), 'social-source-'))
      tempDirs.push(dir)
      const first = join(dir, 'first.png')
      const second = join(dir, 'second.png')
      await buildSocialSource(fileURLToPath(source), first)
      await buildSocialSource(fileURLToPath(source), second)
      const metadata = await sharp(first).metadata()
      expect([metadata.width, metadata.height]).toEqual([1200, 630])
      expect((await readFile(first)).equals(await readFile(second))).toBe(true)
    })
  }
})
