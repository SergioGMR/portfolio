import { describe, expect, test } from 'bun:test'
import { statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import sharp from 'sharp'
import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

const root = join(import.meta.dirname, '..')
const projectsSource = await readFile(
  join(root, 'src/components/sections/ProjectsSection.astro'),
  'utf8',
)

describe('portfolio projects', () => {
  test('keeps current projects first and appends three bilingual showcases', () => {
    expect(PROFESSIONAL_PROFILE.projects.map(({ id }) => id)).toEqual([
      'jauntjar',
      'todo-lux',
      'basuraleza',
      'solutec',
      'wattly',
      'tvradar',
      'duellum',
    ])

    const showcases = PROFESSIONAL_PROFILE.projects.slice(4)
    expect(showcases.every(({ kind }) => kind === 'showcase')).toBe(true)

    for (const project of showcases) {
      if (project.kind !== 'showcase') throw new Error('Expected showcase')
      expect(project.title.es).toBeTruthy()
      expect(project.title.en).toBeTruthy()
      expect(project.category.es).toBeTruthy()
      expect(project.category.en).toBeTruthy()
      expect(project.summary.es).toBeTruthy()
      expect(project.summary.en).toBeTruthy()
      expect(project.experienceIds).toEqual([])
      expect('technologies' in project).toBe(false)
      expect('responsibility' in project).toBe(false)
      expect('result' in project).toBe(false)
    }
  })

  test('uses unique IDs and the verified public destinations', () => {
    const projects = PROFESSIONAL_PROFILE.projects
    const ids = projects.map(({ id }) => id)
    const urls = projects.slice(4).map(({ evidenceUrl }) => evidenceUrl)

    expect(new Set(ids).size).toBe(projects.length)
    expect(urls).toEqual([
      'https://wattly-alpha.vercel.app/',
      'https://tvradar.sgmr.es/',
      'https://duellum.vercel.app/',
    ])
  })

  test('renders one safe responsive loop with the current card design', () => {
    expect(projectsSource).toContain('projects.map')
    expect(projectsSource).toContain("project.kind === 'showcase'")
    expect(projectsSource).toContain('target="_blank"')
    expect(projectsSource).toContain('rel="noreferrer noopener"')
    expect(projectsSource).toContain('sm:grid-cols-2')

    for (const asset of [
      'todo-lux.avif',
      'basuraleza.avif',
      'solutec.avif',
      'jauntjar.avif',
      'wattly.webp',
      'tvradar.webp',
      'duellum.webp',
    ]) {
      expect(projectsSource).toContain(asset)
    }
  })

  test('stores each genuine screenshot at the card aspect ratio', async () => {
    for (const asset of ['wattly.webp', 'tvradar.webp', 'duellum.webp']) {
      const path = join(root, 'src/assets/projects', asset)
      const metadata = await sharp(path).metadata()

      expect(metadata.width).toBe(900)
      expect(metadata.height).toBe(480)
      expect(statSync(path).size).toBeGreaterThan(5_000)
    }
  })
})
