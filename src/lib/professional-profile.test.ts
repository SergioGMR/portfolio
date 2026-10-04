import { describe, expect, test } from 'bun:test'
import {
  PROFESSIONAL_PROFILE,
  sortExperiencesByStartDate,
  type Experience,
  type Project,
} from './professional-profile'

const esText = (value: { es: string | readonly string[] }) =>
  Array.isArray(value.es) ? value.es.join(' ') : value.es

const enText = (value: { en: string | readonly string[] }) =>
  Array.isArray(value.en) ? value.en.join(' ') : value.en

describe('professional profile', () => {
  test('keeps the canonical experience chronology and explicit employment metadata', () => {
    const sorted = sortExperiencesByStartDate(PROFESSIONAL_PROFILE.experiences)

    expect(sorted.map(({ id }) => id)).toEqual([
      'current-project',
      'tecandu',
      'freelance-2020',
    ])
    expect(sorted.map(({ startDate }) => startDate)).toEqual([
      '2023-12-01',
      '2023-10-01',
      '2020-06-30',
    ])

    expect(sorted[0]).toMatchObject({
      id: 'current-project',
      title: {
        es: 'Project Manager | Tech Leader | FullStack Developer',
        en: 'Project Manager | Tech Leader | FullStack Developer',
      },
      employmentType: 'freelance',
      status: 'current',
      startDate: '2023-12-01',
      endDate: null,
      company: { es: 'Freelance', en: 'Freelance' },
      location: { es: 'Las Palmas, España', en: 'Las Palmas, Spain' },
    })
    expect(sorted[1]).toMatchObject({
      id: 'tecandu',
      title: { es: 'FullStack Developer', en: 'FullStack Developer' },
      employmentType: 'freelance',
      status: 'completed',
      startDate: '2023-10-01',
      endDate: '2024-04-23',
      company: {
        es: 'Freelance | Tecandu S.L.',
        en: 'Freelance | Tecandu S.L.',
      },
    })
    expect(sorted[2]).toMatchObject({
      id: 'freelance-2020',
      title: { es: 'Fullstack Developer', en: 'Fullstack Developer' },
      employmentType: 'freelance',
      status: 'completed',
      startDate: '2020-06-30',
      endDate: '2020-10-10',
    })
  })

  test('uses localized fields on each record with matching IDs and no parallel arrays', () => {
    const ids = PROFESSIONAL_PROFILE.experiences.map(({ id }) => id)
    const projectIds = PROFESSIONAL_PROFILE.projects.map(({ id }) => id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(projectIds).size).toBe(projectIds.length)
    expect(PROFESSIONAL_PROFILE.experiences).toHaveLength(3)
    expect(PROFESSIONAL_PROFILE.projects).toHaveLength(7)

    for (const experience of PROFESSIONAL_PROFILE.experiences) {
      expect(experience.title.es).toBeTruthy()
      expect(experience.title.en).toBeTruthy()
      expect(experience.responsibilities.es.length).toBeGreaterThan(0)
      expect(experience.responsibilities.en.length).toBe(
        experience.responsibilities.es.length,
      )
      expect(experience.outcomes.es.length).toBeGreaterThan(0)
      expect(experience.outcomes.en.length).toBe(experience.outcomes.es.length)
    }
  })

  test('keeps projects independent with optional experience links', () => {
    const projects = PROFESSIONAL_PROFILE.projects as readonly Project[]
    const experiences =
      PROFESSIONAL_PROFILE.experiences as readonly Experience[]

    expect(projects.map(({ id }) => id)).toEqual([
      'jauntjar',
      'todo-lux',
      'basuraleza',
      'solutec',
      'wattly',
      'tvradar',
      'duellum',
    ])
    for (const project of projects) {
      expect(project.evidenceUrl).toMatch(/^https:\/\//)
      if (project.kind === 'case-study') {
        expect(project.problem.es).toBeTruthy()
        expect(project.responsibility.es).toBeTruthy()
        expect(project.solution.es).toBeTruthy()
        expect(project.result.es).toBeTruthy()
        expect(project.technologies.length).toBeGreaterThan(0)
      } else {
        expect(project.category.es).toBeTruthy()
        expect(project.category.en).toBeTruthy()
        expect(project.summary.es).toBeTruthy()
        expect(project.summary.en).toBeTruthy()
        expect('technologies' in project).toBe(false)
      }
      if (project.experienceIds.length > 0) {
        expect(
          project.experienceIds.every((experienceId) =>
            experiences.some(({ id }) => id === experienceId),
          ),
        ).toBe(true)
      }
    }

    expect(projects[0]).toMatchObject({
      id: 'jauntjar',
      title: { es: 'JauntJar', en: 'JauntJar' },
      evidenceUrl: 'https://trips.sgmr.es/',
      experienceIds: [],
    })

    expect(JSON.stringify(projects)).not.toMatch(/Tca-Tik/i)
    expect(JSON.stringify(projects)).not.toMatch(/React|hexagonal|TDD/i)
  })

  test('includes canonical education, language evidence, and stable CV URLs', () => {
    expect(PROFESSIONAL_PROFILE.education).toHaveLength(1)
    expect(PROFESSIONAL_PROFILE.education[0]).toMatchObject({
      id: 'web-application-development',
      startDate: '2016-06-30',
      endDate: '2018-04-30',
      institution: { es: 'I.E.S. El Ricón', en: 'I.E.S. El Ricón' },
      qualification: {
        es: 'Certificado de Educación Superior en Desarrollo de Aplicaciones Web',
        en: 'Certificate of Higher Education in Web Application Development',
      },
      level: 'EQF/MEC 5',
    })
    expect(PROFESSIONAL_PROFILE.languages).toEqual([
      expect.objectContaining({
        id: 'english',
        name: { es: 'Inglés', en: 'English' },
        levels: {
          listening: 'B2',
          reading: 'B2',
          writing: 'B1',
          spokenProduction: 'B1',
          spokenInteraction: 'B1',
        },
      }),
    ])
    expect(PROFESSIONAL_PROFILE.cvUrls).toEqual({
      es: '/sergio-morales-es.pdf',
      en: '/sergio-morales-en.pdf',
    })
    expect(JSON.stringify(PROFESSIONAL_PROFILE)).not.toMatch(
      /2024-(es|en)\.pdf/,
    )
  })

  test('connects every displayed capability to canonical evidence IDs', () => {
    const evidenceIds = new Set([
      ...PROFESSIONAL_PROFILE.experiences.map(({ id }) => id),
      ...PROFESSIONAL_PROFILE.projects.map(({ id }) => id),
    ])

    expect(PROFESSIONAL_PROFILE.capabilities.length).toBeGreaterThan(0)
    for (const capability of PROFESSIONAL_PROFILE.capabilities) {
      expect(capability.label.es).toBeTruthy()
      expect(capability.label.en).toBeTruthy()
      expect(capability.summary.es).toBeTruthy()
      expect(capability.summary.en).toBeTruthy()
      expect(capability.technologies.length).toBeGreaterThan(0)
      expect(capability.evidenceIds.every((id) => evidenceIds.has(id))).toBe(
        true,
      )
    }

    expect(
      PROFESSIONAL_PROFILE.capabilities
        .find(({ id }) => id === 'web-and-mobile')
        ?.technologies.includes('Astro 7'),
    ).toBe(true)
  })

  test('does not include unsupported or stale professional claims', () => {
    const serialized = JSON.stringify(PROFESSIONAL_PROFILE)

    expect(serialized).not.toMatch(/Tca-Tik/i)
    expect(serialized).not.toMatch(/React|hexagonal architecture|TDD/i)
    expect(
      esText(PROFESSIONAL_PROFILE.experiences[0].responsibilities),
    ).toContain('Laravel')
    expect(
      enText(PROFESSIONAL_PROFILE.experiences[0].responsibilities),
    ).toContain('Laravel')
  })
})
