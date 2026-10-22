import { describe, expect, test } from 'bun:test'
import { PAGE_METADATA } from './page-metadata'
import { createProfileFaq } from './profile-faq'
import {
  AVAILABILITY,
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
    '¿Está disponible para nuevos proyectos?',
    '¿Cómo contactar con Sergio?',
  ],
  en: [
    'Who is Sergio Morales Rodríguez?',
    'Which technologies does he work with?',
    'What projects has he built?',
    'Which languages does he speak?',
    'Is he available for new work?',
    'How can I contact Sergio?',
  ],
} as const

const earliestStartYear = PROFESSIONAL_PROFILE.experiences
  .map((experience) => experience.startDate)
  .sort()[0]!
  .slice(0, 4)

const caseStudies = PROFESSIONAL_PROFILE.projects.filter(
  (project) => project.kind === 'case-study',
)

const joinNames = (language: (typeof languages)[number]) => {
  const names = caseStudies.map((project) => project.title[language])
  const last = names.pop()!
  return `${names.join(', ')}${language === 'es' ? ' y' : ', and'} ${last}`
}

describe('createProfileFaq', () => {
  for (const language of languages) {
    describe(language, () => {
      const faq = createProfileFaq(language)

      test('returns the six questions in order', () => {
        expect(faq.map((item) => item.question)).toEqual([
          ...questions[language],
        ])
        expect(new Set(faq.map((item) => item.id)).size).toBe(6)
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

      test('states when professional experience began, derived from the profile', () => {
        expect(earliestStartYear).toBe('2020')
        const answer = faq[0]!.answer
        expect(answer).toContain(
          language === 'es'
            ? `Su trayectoria profesional comienza en ${earliestStartYear}.`
            : `His professional experience goes back to ${earliestStartYear}.`,
        )
        // The history has gaps: only the start year is claimed, never a total.
        expect(answer).not.toMatch(/\d+\+? (?:años|years)/i)
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

      test('never uses the spelling "portafolio" (the site spells it "portfolio")', () => {
        for (const item of faq) {
          expect(item.question).not.toContain('portafolio')
          expect(item.answer).not.toContain('portafolio')
        }
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
        expect(caseStudies).toHaveLength(8)
        expect(item.links).toHaveLength(8)
      })

      test('has no other projects to mention, so it omits that sentence', () => {
        expect(faq[2]!.answer).not.toMatch(
          /otros proyectos|other projects|también muestra|also shows/,
        )
        expect(faq[2]!.answer).toBe(
          language === 'es'
            ? `Tiene casos de estudio documentados: ${joinNames(language)}.`
            : `He has documented case studies: ${joinNames(language)}.`,
        )
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

      test('answers availability with the shared footer wording and links to contact', () => {
        const item = faq[4]!
        expect(item.id).toBe('disponibilidad')
        expect(item.answer).toContain(AVAILABILITY[language])
        expect(item.answer).toStartWith(language === 'es' ? 'Sí. ' : 'Yes. ')
        expect(item.answer).toContain(
          language === 'es'
            ? 'puedes proponerle un proyecto o hablar de una oportunidad profesional'
            : 'you can propose a project or discuss a career opportunity',
        )
        expect(item.links).toEqual([
          {
            label:
              language === 'es'
                ? 'Ir a la sección de contacto'
                : 'Go to the contact section',
            href: language === 'es' ? '/#contacto' : '/en#contacto',
            external: false,
          },
        ])
        expect(faq.map((entry) => entry.id).indexOf('disponibilidad')).toBe(
          faq.map((entry) => entry.id).indexOf('contacto') - 1,
        )
      })

      test('offers email and LinkedIn from the profile for projects or careers', () => {
        const item = faq[5]!
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

      test('invents no rates, seniority years or claims, and availability only in its own item', () => {
        const others = faq.filter((item) => item.id !== 'disponibilidad')
        expect(others.map((item) => item.answer).join(' ')).not.toMatch(
          /disponib|available|open to/i,
        )
        const text = faq.map((item) => item.answer).join(' ')
        expect(text).not.toMatch(
          /tarifa|\brates?\b|€|\$|años de experiencia|years of experience|\d+\+? (?:años|years)/i,
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
