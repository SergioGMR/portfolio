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
  test('keeps current projects first and appends four bilingual showcases', () => {
    expect(PROFESSIONAL_PROFILE.projects.map(({ id }) => id)).toEqual([
      'jauntjar',
      'todo-lux',
      'basuraleza',
      'wattly',
      'tvradar',
      'duellum',
      'uploadimg',
    ])

    const showcases = PROFESSIONAL_PROFILE.projects.slice(3)
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

  test('removes Solutec from public data while preserving Tecandu evidence', () => {
    expect(JSON.stringify(PROFESSIONAL_PROFILE)).not.toMatch(/solutec/i)
    expect(projectsSource).not.toMatch(/solutec/i)
    const tecandu = PROFESSIONAL_PROFILE.experiences.find(
      ({ id }) => id === 'tecandu',
    )
    expect(tecandu).toBeDefined()
    expect(tecandu?.evidenceUrl).toBeUndefined()
    expect(tecandu?.technologies).toEqual([
      'Laravel',
      'Laravel Sanctum',
      'GitHub Actions',
      'Plesk',
    ])
    expect(tecandu?.responsibilities).toEqual({
      es: [
        'Adaptación de tecnologías a los nuevos tiempos',
        'Coordinación del equipo de desarrollo y del equipo DevOps',
        'Estudio y rediseño de la base de datos para transferir datos sin pérdida de información o funcionalidades',
        'Desarrollo de una nueva versión v3 de la API utilizando Laravel Sanctum',
        'Planificación de las pruebas faltantes y su implementación',
        'Desarrollo de CI/CD con GitHub Actions y Plesk',
      ],
      en: [
        'Adapting technologies to current needs',
        'Coordination of the development team and the DevOps team',
        'Study and redesign of the database to transfer data without losing information or functionality',
        'Development of a new v3 API version using Laravel Sanctum',
        'Planning and implementation of missing tests',
        'CI/CD development with GitHub Actions and Plesk',
      ],
    })
    expect(tecandu?.outcomes).toEqual({
      es: [
        'API v3 desarrollada con Laravel Sanctum',
        'Pruebas pendientes planificadas e implementadas',
        'CI/CD desarrollado con GitHub Actions y Plesk',
      ],
      en: [
        'v3 API developed with Laravel Sanctum',
        'Missing tests planned and implemented',
        'CI/CD developed with GitHub Actions and Plesk',
      ],
    })
    for (const id of ['technical-coordination', 'delivery-and-testing']) {
      const capability = PROFESSIONAL_PROFILE.capabilities.find(
        (capability) => capability.id === id,
      )
      expect(capability?.evidenceIds).toContain('tecandu')
    }
  })

  test('uses unique IDs and the verified public destinations', () => {
    const projects = PROFESSIONAL_PROFILE.projects
    const ids = projects.map(({ id }) => id)
    const urls = projects.slice(3).map(({ evidenceUrl }) => evidenceUrl)

    expect(new Set(ids).size).toBe(projects.length)
    expect(urls).toEqual([
      'https://wattly-alpha.vercel.app/',
      'https://tvradar.sgmr.es/',
      'https://duellum.vercel.app/',
      'https://uploadimg.vercel.app/',
    ])
  })

  test('renders one safe responsive loop with the current card design', () => {
    expect(projectsSource).toContain('projects.map')
    expect(projectsSource).toContain("project.kind === 'showcase'")
    expect(projectsSource).toContain("project.kind === 'showcase' ? '_blank'")
    expect(projectsSource).toContain('rel="noreferrer noopener"')
    expect(projectsSource).toContain('sm:grid-cols-2')

    for (const asset of [
      'todo-lux.avif',
      'basuraleza.avif',
      'jauntjar.avif',
      'wattly.webp',
      'tvradar.webp',
      'duellum.webp',
      'uploadimg.webp',
    ]) {
      expect(projectsSource).toContain(asset)
    }
  })

  test('stores each genuine screenshot at the card aspect ratio', async () => {
    for (const asset of [
      'wattly.webp',
      'tvradar.webp',
      'duellum.webp',
      'uploadimg.webp',
    ]) {
      const path = join(root, 'src/assets/projects', asset)
      const metadata = await sharp(path).metadata()

      expect(metadata.width).toBe(900)
      expect(metadata.height).toBe(480)
      expect(statSync(path).size).toBeGreaterThan(5_000)
    }
  })
})
