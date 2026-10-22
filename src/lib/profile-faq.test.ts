import { describe, expect, test } from 'bun:test'
import { PAGE_METADATA } from './page-metadata'
import { createProfileFaq } from './profile-faq'
import {
  DEVELOPS,
  EXPERIENCE,
  HOME_LOCATION,
  HOME_LOCATION_WITH_COUNTRY,
} from './profile-summary'
import { PROFESSIONAL_PROFILE } from './professional-profile'
import { INDEXABLE_PATHS } from './site'

const languages = ['es', 'en'] as const

const questions = {
  es: [
    '¿Quién es Sergio Morales Rodríguez?',
    '¿Con qué tecnologías trabaja?',
    '¿Qué proyectos ha desarrollado?',
    '¿Qué idiomas habla?',
    '¿Cómo contactar con Sergio?',
  ],
  en: [
    'Who is Sergio Morales Rodríguez?',
    'Which technologies does he work with?',
    'What projects has he built?',
    'Which languages does he speak?',
    'How can I contact Sergio?',
  ],
} as const

const caseStudies = PROFESSIONAL_PROFILE.projects.filter(
  (project) => project.kind === 'case-study',
)
const showcases = PROFESSIONAL_PROFILE.projects.filter(
  (project) => project.kind === 'showcase',
)

describe('createProfileFaq', () => {
  for (const language of languages) {
    describe(language, () => {
      const faq = createProfileFaq(language)

      test('returns the five questions in order', () => {
        expect(faq.map((item) => item.question)).toEqual([
          ...questions[language],
        ])
        expect(new Set(faq.map((item) => item.id)).size).toBe(5)
      })

      test('has no empty or undefined text anywhere', () => {
        for (const item of faq) {
          for (const text of [
            item.id,
            item.question,
            item.answer,
            ...item.links.flatMap((link) => [link.label, link.href]),
          ]) {
            expect(text.trim()).not.toBe('')
            expect(text).not.toContain('undefined')
            expect(text).not.toContain('[object')
            expect(text).not.toContain('null')
          }
        }
      })

      test('describes the person from the profile and existing site wording', () => {
        const answer = faq[0]!.answer
        expect(answer).toContain(PROFESSIONAL_PROFILE.person.name)
        expect(answer).toContain('Las Palmas de Gran Canaria')
        expect(answer).toContain('Laravel')
        expect(answer).toContain('DevOps')
        expect(answer).toContain(
          language === 'es' ? 'Tech Lead Full Stack' : 'Full Stack Tech Lead',
        )
        expect(JSON.stringify(PAGE_METADATA.home[language].schema)).toContain(
          'Las Palmas de Gran Canaria',
        )
      })

      test('shares its person wording with the Person description', () => {
        const answer = faq[0]!.answer
        const description = (
          PAGE_METADATA.home[language].schema as {
            mainEntity: { description: string }
          }
        ).mainEntity.description
        for (const shared of [
          DEVELOPS[language],
          EXPERIENCE[language],
          HOME_LOCATION,
          HOME_LOCATION_WITH_COUNTRY[language],
        ]) {
          expect(answer).toContain(shared)
        }
        for (const shared of [
          DEVELOPS[language],
          EXPERIENCE[language],
          HOME_LOCATION,
        ]) {
          expect(description).toContain(shared)
        }
      })

      test('describes coordination as past experience, not a current role', () => {
        const description = (
          PAGE_METADATA.home[language].schema as {
            mainEntity: { description: string }
          }
        ).mainEntity.description
        expect(`${faq[0]!.answer} ${description}`).not.toMatch(
          /\bcoordina\b|\bcoordinates\b/,
        )
      })

      test('uses the site spelling "portfolio" in Spanish', () => {
        expect(faq[2]!.answer).not.toContain('portafolio')
        if (language === 'es')
          expect(faq[2]!.answer).toContain('En el portfolio')
      })

      test('lists every capability label with its technologies', () => {
        const answer = faq[1]!.answer
        for (const capability of PROFESSIONAL_PROFILE.capabilities) {
          expect(answer).toContain(capability.label[language])
          for (const technology of capability.technologies) {
            expect(answer).toContain(technology)
          }
        }
      })

      test('names every project and links case studies to indexable pages', () => {
        const item = faq[2]!
        for (const project of PROFESSIONAL_PROFILE.projects) {
          expect(item.answer).toContain(project.title[language])
        }
        expect(item.links.map((link) => link.href)).toEqual(
          caseStudies.map((project) =>
            language === 'es'
              ? `/proyectos/${project.id}`
              : `/en/projects/${project.id}`,
          ),
        )
        for (const link of item.links) {
          expect(INDEXABLE_PATHS as readonly string[]).toContain(link.href)
          expect(link.external).toBe(false)
        }
        for (const [index, project] of caseStudies.entries()) {
          expect(item.links[index]!.label).toContain(project.title[language])
        }
        expect(showcases.length).toBeGreaterThan(0)
      })

      test('states the English levels precisely and never claims native', () => {
        const answer = faq[3]!.answer
        const levels = PROFESSIONAL_PROFILE.languages[0]!.levels
        expect(levels).toMatchObject({
          listening: 'B2',
          reading: 'B2',
          writing: 'B1',
          spokenProduction: 'B1',
          spokenInteraction: 'B1',
        })
        const labels =
          language === 'es'
            ? [
                'comprensión auditiva',
                'comprensión lectora',
                'expresión escrita',
                'producción oral',
                'interacción oral',
              ]
            : [
                'listening',
                'reading',
                'writing',
                'spoken production',
                'spoken interaction',
              ]
        for (const label of labels) expect(answer).toContain(label)
        expect(answer).toContain(
          language === 'es'
            ? 'B2 en comprensión auditiva y comprensión lectora'
            : 'B2 in listening and reading',
        )
        expect(answer).toContain(
          language === 'es'
            ? 'B1 en expresión escrita, producción oral e interacción oral'
            : 'B1 in writing, spoken production, and spoken interaction',
        )
        expect(answer).toContain(language === 'es' ? 'español' : 'Spanish')
        expect(answer).toContain(language === 'es' ? 'inglés' : 'English')
        expect(answer.toLowerCase()).not.toMatch(/nativ|native|bilingüe|fluent/)
      })

      test('offers email and LinkedIn from the profile for projects or careers', () => {
        const item = faq[4]!
        expect(item.links.map((link) => link.href)).toEqual([
          PROFESSIONAL_PROFILE.links.mail,
          PROFESSIONAL_PROFILE.links.linkedin,
        ])
        expect(item.links.map((link) => link.external)).toEqual([false, true])
        expect(item.answer).toContain(
          language === 'es'
            ? 'proponerle un proyecto o hablar de una oportunidad'
            : 'propose a project or discuss a career opportunity',
        )
        expect(item.answer).toContain('LinkedIn')
      })

      test('invents no availability, rates, seniority years or claims', () => {
        const text = faq.map((item) => item.answer).join(' ')
        expect(text).not.toMatch(
          /disponib|available|tarifa|\brates?\b|€|\$|años de experiencia|years of experience|\d+\+? (?:años|years)/i,
        )
      })
    })
  }

  test('differs per language and does not leak the other one', () => {
    const es = createProfileFaq('es')
    const en = createProfileFaq('en')
    expect(es.map((item) => item.id)).toEqual(en.map((item) => item.id))
    expect(es[0]!.answer).not.toBe(en[0]!.answer)
    expect(es.map((item) => item.answer).join(' ')).not.toContain('Spanish')
    expect(en.map((item) => item.answer).join(' ')).not.toContain('español')
  })
})
