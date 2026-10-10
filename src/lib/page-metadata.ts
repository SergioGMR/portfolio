import type { Language, LanguageMetadata } from './language-client'
import type { CaseStudyProject } from './professional-profile'
import { PROFESSIONAL_PROFILE } from './professional-profile'
import { getAlternatePaths, SITE_URL } from './site'

const PORTFOLIO_URL = new URL('/', SITE_URL).toString()
export const PERSON_ID = `${PORTFOLIO_URL}#person`

const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: PROFESSIONAL_PROFILE.person.name,
  url: PORTFOLIO_URL,
  jobTitle: 'Tech Lead Full Stack',
  sameAs: [
    PROFESSIONAL_PROFILE.links.github,
    PROFESSIONAL_PROFILE.links.linkedin,
    PROFESSIONAL_PROFILE.links.twitter,
  ],
}

function pageSchema(
  type: string,
  path: string,
  language: Language,
  title: string,
  description: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${new URL(getAlternatePaths(path)[language], SITE_URL)}#page`,
    url: new URL(getAlternatePaths(path)[language], SITE_URL).toString(),
    name: title,
    description,
    inLanguage: language,
    author: { '@id': PERSON_ID },
  }
}

function createTermsMetadata(app: string, path: string): LanguageMetadata {
  const entry = (language: Language) => {
    const title =
      language === 'es'
        ? `Términos de Servicio — ${app}`
        : `Terms of Service — ${app}`
    const description =
      language === 'es'
        ? `Términos de Servicio de la aplicación ${app}.`
        : `Terms of Service for the ${app} application.`
    return {
      title,
      description,
      imageAlt: title,
      schema: pageSchema('WebPage', path, language, title, description),
    }
  }
  return { es: entry('es'), en: entry('en') }
}

const homeEntry = (language: Language) => {
  const title =
    language === 'es'
      ? 'Sergio Morales Rodríguez — Tech Lead Full Stack | Laravel'
      : 'Sergio Morales Rodríguez — Full Stack Tech Lead | Laravel'
  const description =
    language === 'es'
      ? 'Sergio Morales Rodríguez, Tech Lead Full Stack en Las Palmas. Arquitectura y desarrollo web con Laravel, APIs y coordinación de desarrollo y DevOps.'
      : 'Sergio Morales Rodríguez, a Full Stack Tech Lead based in Las Palmas. Laravel web architecture and development, APIs, and development and DevOps coordination.'
  return {
    title,
    description,
    imageAlt:
      language === 'es'
        ? 'Presentación del portfolio de Sergio Morales Rodríguez'
        : 'Sergio Morales Rodríguez portfolio preview',
    schema: {
      ...pageSchema('ProfilePage', '/', language, title, description),
      mainEntity: person,
    },
  }
}

export const PAGE_METADATA = {
  home: { es: homeEntry('es'), en: homeEntry('en') },
  acezone: createTermsMetadata('AceZone', '/acezone/tos'),
  wattly: createTermsMetadata('Wattly', '/wattly/tos'),
} satisfies Record<string, LanguageMetadata>

export function createCaseStudyMetadata(
  project: CaseStudyProject,
): LanguageMetadata {
  const entry = (language: Language) => {
    const title = `${project.title[language]} — ${language === 'es' ? 'Desarrollo con Laravel' : 'Laravel development'} | Sergio Morales Rodríguez`
    const description = `${project.title[language]}: ${project.summary[language]}`
    return {
      title,
      description,
      imageAlt:
        language === 'es'
          ? 'Presentación del portfolio de Sergio Morales Rodríguez'
          : 'Sergio Morales Rodríguez portfolio preview',
      schema: {
        ...pageSchema(
          'WebPage',
          `/proyectos/${project.id}`,
          language,
          title,
          description,
        ),
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: language === 'es' ? 'Proyectos' : 'Projects',
              item: `${SITE_URL}${language === 'es' ? '/' : '/en'}#proyectos`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: project.title[language],
              item: new URL(
                getAlternatePaths(`/proyectos/${project.id}`)[language],
                SITE_URL,
              ).toString(),
            },
          ],
        },
        mainEntity: {
          '@type': 'CreativeWork',
          name: project.title[language],
          description: project.solution[language],
          inLanguage: language,
          creator: { '@id': PERSON_ID },
          url: new URL(
            getAlternatePaths(`/proyectos/${project.id}`)[language],
            SITE_URL,
          ).toString(),
        },
      },
    }
  }
  return { es: entry('es'), en: entry('en') }
}
