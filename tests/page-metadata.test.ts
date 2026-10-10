import { describe, expect, test } from 'bun:test'
import { PROFESSIONAL_PROFILE } from '../src/lib/professional-profile'
import { getAlternatePaths } from '../src/lib/site'
import {
  PAGE_METADATA,
  createCaseStudyMetadata,
} from '../src/lib/page-metadata'

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
