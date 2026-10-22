import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'
import { PAGE_LAST_MODIFIED, getAlternatePaths } from '../src/lib/site'
import {
  PAGE_METADATA,
  PERSON_ID,
  createCaseStudyMetadata,
  createPerson,
} from '../src/lib/page-metadata'

const caseStudies = PROFESSIONAL_PROFILE.projects.filter(
  (project) => project.kind === 'case-study',
)
const languages = ['es', 'en'] as const

function pngSize(path: string) {
  const bytes = readFileSync(new URL(path, import.meta.url))
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(bytes.subarray(12, 16).toString('ascii')).toBe('IHDR')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('person entity', () => {
  test('describes one localized, factual person with a stable identity', () => {
    for (const language of languages) {
      const person = createPerson(language)
      expect(person['@type']).toBe('Person')
      expect(person['@id']).toBe(PERSON_ID)
      expect(PERSON_ID).toBe('https://sgmr.dev/#person')
      expect(person.name).toBe('Sergio Morales Rodríguez')
      expect(person.alternateName).toBe('SergioGMR')
      expect(person.url).toBe('https://sgmr.dev/')
      expect(person.jobTitle).toBe('Tech Lead Full Stack')
      expect(person.image).toBe('https://sgmr.dev/sergio-morales-avatar.png')
      expect(person.homeLocation).toEqual({
        '@type': 'Place',
        name: 'Las Palmas de Gran Canaria',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Las Palmas de Gran Canaria',
          addressCountry: 'ES',
        },
      })
      expect(person.knowsLanguage).toEqual(['es', 'en'])
      expect(person.alumniOf).toEqual({
        '@type': 'EducationalOrganization',
        name: PROFESSIONAL_PROFILE.education[0]!.institution[language],
      })
      expect(person.alumniOf.name).toBe('I.E.S. El Rincón')
      expect(person.sameAs).toEqual([
        PROFESSIONAL_PROFILE.links.github,
        PROFESSIONAL_PROFILE.links.linkedin,
        PROFESSIONAL_PROFILE.links.twitter,
      ])
      expect(JSON.stringify(person)).not.toMatch(/mailto|@icloud|email/i)
    }
  })
  test('describes the person in the page language using existing profile wording', () => {
    expect(createPerson('es').description).toBe(
      'Tech Lead Full Stack en Las Palmas de Gran Canaria. Desarrolla aplicaciones web y APIs con Laravel y tiene experiencia coordinando equipos de desarrollo y DevOps.',
    )
    expect(createPerson('en').description).toBe(
      'Full Stack Tech Lead based in Las Palmas de Gran Canaria. Develops web applications and APIs with Laravel and has experience coordinating development and DevOps teams.',
    )
  })
  test('knows about the deduplicated capability technologies in profile order', () => {
    const expected = [
      ...new Set(
        PROFESSIONAL_PROFILE.capabilities.flatMap(
          (capability) => capability.technologies,
        ),
      ),
    ]
    for (const language of languages) {
      expect(createPerson(language).knowsAbout).toEqual(expected)
    }
    expect(expected[0]).toBe('Laravel')
    expect(new Set(expected).size).toBe(expected.length)
  })
  test('is embedded in full on the home, case-study and terms pages', () => {
    for (const language of languages) {
      const person = createPerson(language)
      expect(PAGE_METADATA.home[language].schema.mainEntity).toEqual(person)
      // The home page embeds the person once, as mainEntity; author references it.
      expect(PAGE_METADATA.home[language].schema.author).toEqual({
        '@id': PERSON_ID,
      })
      for (const app of ['acezone', 'wattly'] as const) {
        expect(PAGE_METADATA[app][language].schema?.author).toEqual(person)
      }
      for (const project of caseStudies) {
        const schema = createCaseStudyMetadata(project)[language].schema!
        expect(schema.author).toEqual(person)
        expect((schema.mainEntity as Record<string, unknown>).creator).toEqual({
          '@id': PERSON_ID,
        })
      }
    }
  })
})

describe('page schema dates and site', () => {
  test('every page schema carries the last-modified date of its own path', () => {
    for (const language of languages) {
      expect(PAGE_METADATA.home[language].schema.dateModified).toBe(
        PAGE_LAST_MODIFIED[language === 'es' ? '/' : '/en'],
      )
      for (const [app, path] of [
        ['acezone', '/acezone/tos'],
        ['wattly', '/wattly/tos'],
      ] as const) {
        expect(PAGE_METADATA[app][language].schema?.dateModified).toBe(
          PAGE_LAST_MODIFIED[getAlternatePaths(path)[language] as '/'],
        )
      }
      for (const project of caseStudies) {
        expect(
          createCaseStudyMetadata(project)[language].schema?.dateModified,
        ).toBe(
          PAGE_LAST_MODIFIED[
            getAlternatePaths(`/proyectos/${project.id}`)[language] as '/'
          ],
        )
      }
    }
  })
  test('home profile belongs to the website published by the person', () => {
    for (const language of languages) {
      expect(PAGE_METADATA.home[language].schema.isPartOf).toEqual({
        '@type': 'WebSite',
        '@id': 'https://sgmr.dev/#website',
        url: 'https://sgmr.dev/',
        name: 'Sergio Morales Rodríguez',
        alternateName: 'SergioGMR',
        inLanguage: ['es', 'en'],
        publisher: { '@id': PERSON_ID },
      })
    }
  })
  test('keeps every schema a single object without a graph', () => {
    for (const language of languages) {
      expect(Object.keys(PAGE_METADATA.home[language].schema)).not.toContain(
        '@graph',
      )
    }
  })
})

describe('case-study social card text', () => {
  test('describes the project screenshot in the page language', () => {
    for (const project of caseStudies) {
      expect(createCaseStudyMetadata(project).es.imageAlt).toBe(
        `Captura de la interfaz de ${project.title.es}`,
      )
      expect(createCaseStudyMetadata(project).en.imageAlt).toBe(
        `${project.title.en} interface screenshot`,
      )
    }
  })
})

describe('published identity images', () => {
  test('the person avatar is a 500x500 PNG', () => {
    expect(pngSize('../public/sergio-morales-avatar.png')).toEqual({
      width: 500,
      height: 500,
    })
  })
  test('the icon set has the declared formats and sizes', () => {
    expect(pngSize('../public/favicon-96x96.png')).toEqual({
      width: 96,
      height: 96,
    })
    expect(pngSize('../public/apple-touch-icon.png')).toEqual({
      width: 180,
      height: 180,
    })
    const ico = readFileSync(new URL('../public/favicon.ico', import.meta.url))
    expect(ico.readUInt16LE(0)).toBe(0)
    expect(ico.readUInt16LE(2)).toBe(1)
    expect(ico.readUInt16LE(4)).toBe(1)
    expect([ico[6], ico[7]]).toEqual([32, 32])
    const size = ico.readUInt32LE(14)
    const offset = ico.readUInt32LE(18)
    expect(offset + size).toBe(ico.length)
    expect(ico.subarray(offset, offset + 8).toString('hex')).toBe(
      '89504e470d0a1a0a',
    )
    expect(ico.readUInt32BE(offset + 16)).toBe(32)
    expect(ico.readUInt32BE(offset + 20)).toBe(32)
  })
})

describe('page identity', () => {
  test('home describes a profile with a stable canonical person across languages', () => {
    for (const language of ['es', 'en'] as const) {
      const schema = PAGE_METADATA.home[language].schema
      expect(schema['@type']).toBe('ProfilePage')
      expect(schema.inLanguage).toBe(language)
      expect(schema.url).toBe(
        language === 'es' ? 'https://sgmr.dev/' : 'https://sgmr.dev/en',
      )
      expect(schema.mainEntity['@id']).toBe('https://sgmr.dev/#person')
      expect(schema.mainEntity.url).toBe('https://sgmr.dev/')
    }
  })
  test('terms describe the legal page with the stable author, never a website', () => {
    for (const app of ['acezone', 'wattly'] as const) {
      for (const language of ['es', 'en'] as const) {
        const schema = PAGE_METADATA[app][language].schema
        if (!schema) throw new Error('Missing legal page schema')
        expect(schema['@type']).toBe('WebPage')
        expect(schema.url).toBe(
          `https://sgmr.dev${language === 'en' ? '/en' : ''}/${app}/tos`,
        )
        expect((schema.author as Record<string, unknown>)['@id']).toBe(
          'https://sgmr.dev/#person',
        )
      }
    }
  })
})

describe('visible case-study breadcrumb identity', () => {
  test('describes the visible projects section and current case in both languages', () => {
    for (const project of PROFESSIONAL_PROFILE.projects) {
      if (project.kind !== 'case-study') continue
      for (const language of ['es', 'en'] as const) {
        const metadata = createCaseStudyMetadata(project)[language]
        expect(metadata.schema?.breadcrumb).toEqual({
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: language === 'es' ? 'Proyectos' : 'Projects',
              item: `https://sgmr.dev${language === 'es' ? '/' : '/en'}#proyectos`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: project.title[language],
              item: new URL(
                getAlternatePaths(`/proyectos/${project.id}`)[language],
                'https://sgmr.dev',
              ).toString(),
            },
          ],
        })
      }
    }
  })
})
