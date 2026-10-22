import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'

describe('main integration project case studies', () => {
  test('keeps the three original case studies first and the five former showcases after them', () => {
    expect(PROFESSIONAL_PROFILE.projects.map(({ id }) => id)).toEqual([
      'jauntjar',
      'todo-lux',
      'basuraleza',
      'wattly',
      'tvradar',
      'duellum',
      'uploadimg',
      'uploadimg-desktop',
    ])

    for (const project of PROFESSIONAL_PROFILE.projects) {
      expect(project.kind).toBe('case-study')
      expect(project.imageKey).toBe(project.id)
      expect(project.evidenceUrl).toMatch(/^https:\/\//)
    }
    for (const project of PROFESSIONAL_PROFILE.projects.slice(3))
      expect(project.experienceIds).toEqual([])
  })

  test('renders every card from the genuine project captures and links it to its case', async () => {
    const source = await readFile(
      new URL(
        '../src/components/sections/ProjectsSection.astro',
        import.meta.url,
      ),
      'utf8',
    )

    expect(source).not.toContain('showcase')

    for (const asset of [
      'wattly.webp',
      'tvradar.webp',
      'duellum.webp',
      'uploadimg.webp',
      'uploadimg-desktop.webp',
    ]) {
      expect(source).toContain(asset)
    }
  })

  test('shows the same project images on each case-study page', async () => {
    const source = await readFile(
      new URL('../src/components/pages/CaseStudyPage.astro', import.meta.url),
      'utf8',
    )

    for (const asset of [
      'wattly.webp',
      'tvradar.webp',
      'duellum.webp',
      'uploadimg.webp',
      'uploadimg-desktop.webp',
    ]) {
      expect(source).toContain(`@/assets/projects/${asset}`)
    }
    for (const id of [
      'wattly',
      'tvradar',
      'duellum',
      'uploadimg',
      'uploadimg-desktop',
    ])
      expect(source).toContain(`@/assets/social/${id}.png`)
  })
})
