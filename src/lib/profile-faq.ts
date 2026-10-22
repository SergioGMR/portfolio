import type { Language } from './language-client'
import {
  PROFESSIONAL_PROFILE,
  type LanguageProficiency,
} from './professional-profile'
import {
  AVAILABILITY,
  DEVELOPS,
  EXPERIENCE,
  HOME_LOCATION_WITH_COUNTRY,
  ROLE_TITLE,
} from './profile-summary'
import { getAlternatePaths } from './site'

export interface ProfileFaqLink {
  label: string
  href: string
  /** Opens a different site, so the link follows the site's external-link attributes. */
  external: boolean
}

export interface ProfileFaqItem {
  id: string
  question: string
  answer: string
  links: ProfileFaqLink[]
}

type LanguageLevels = LanguageProficiency['levels']

// Same wording as the Education/Languages card, lowercased for running text.
const LEVEL_LABELS: Record<Language, Record<keyof LanguageLevels, string>> = {
  es: {
    listening: 'comprensión auditiva',
    reading: 'comprensión lectora',
    writing: 'expresión escrita',
    spokenProduction: 'producción oral',
    spokenInteraction: 'interacción oral',
  },
  en: {
    listening: 'listening',
    reading: 'reading',
    writing: 'writing',
    spokenProduction: 'spoken production',
    spokenInteraction: 'spoken interaction',
  },
}

const TEXT = {
  es: {
    questions: [
      `¿Quién es ${PROFESSIONAL_PROFILE.person.name}?`,
      '¿Con qué tecnologías trabaja?',
      '¿Qué proyectos ha desarrollado?',
      '¿Qué idiomas habla?',
      '¿Está disponible para nuevos proyectos?',
      '¿Cómo contactar con Sergio?',
    ],
    in: 'en',
  },
  en: {
    questions: [
      `Who is ${PROFESSIONAL_PROFILE.person.name}?`,
      'Which technologies does he work with?',
      'What projects has he built?',
      'Which languages does he speak?',
      'Is he available for new work?',
      'How can I contact Sergio?',
    ],
    in: 'in',
  },
} as const

/** "A", "A y B", "A, B y C" in Spanish; "A, B, and C" in English (site style). */
function joinList(items: readonly string[], language: Language): string {
  if (items.length <= 1) return items.join('')
  const last = items.at(-1)!
  // Spanish turns "y" into "e" before an "i" sound ("producción oral e interacción oral").
  const word =
    language === 'es' ? (/^hi(?!e)|^i/i.test(last) ? 'e' : 'y') : 'and'
  if (items.length === 2) return `${items[0]} ${word} ${last}`
  const head = items.slice(0, -1).join(', ')
  return `${head}${language === 'en' ? ',' : ''} ${word} ${last}`
}

/** Groups the five skills by CEFR level, highest level first. */
function describeEnglishLevels(
  levels: LanguageLevels,
  language: Language,
): string {
  const groups = new Map<string, string[]>()
  for (const key of Object.keys(
    LEVEL_LABELS[language],
  ) as (keyof LanguageLevels)[]) {
    const level = levels[key]
    groups.set(level, [
      ...(groups.get(level) ?? []),
      LEVEL_LABELS[language][key],
    ])
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(
      ([level, skills]) =>
        `${level} ${TEXT[language].in} ${joinList(skills, language)}`,
    )
    .join(language === 'es' ? ', y ' : ', and ')
}

/** Year of the earliest experience in the profile; never a total of years. */
function firstExperienceYear(): string {
  const [earliest] = PROFESSIONAL_PROFILE.experiences
    .map((experience) => experience.startDate)
    .sort()
  if (!earliest) throw new Error('The profile has no experience entries')
  return earliest.slice(0, 4)
}

/**
 * Builds the visible FAQ for one language. Every fact comes from
 * `PROFESSIONAL_PROFILE` or from wording the site already shows (availability
 * is the footer's `AVAILABILITY`); nothing about rates, seniority or
 * native-level claims is added.
 */
export function createProfileFaq(language: Language): ProfileFaqItem[] {
  const profile = PROFESSIONAL_PROFILE
  const [who, technologies, projects, languages, availability, contact] =
    TEXT[language].questions
  // Every project is a case study with its own page.
  const caseStudies = profile.projects
  const english = profile.languages[0]!
  const names = (list: readonly { title: Record<Language, string> }[]) =>
    joinList(
      list.map((project) => project.title[language]),
      language,
    )
  const since = firstExperienceYear()
  const homePath = getAlternatePaths('/')[language]
  const capabilities = profile.capabilities
    .map(
      (capability) =>
        `${capability.label[language]} (${capability.technologies.join(', ')})`,
    )
    .join('; ')

  const answers =
    language === 'es'
      ? {
          who: `${profile.person.name} es ${ROLE_TITLE.es} con base en ${HOME_LOCATION_WITH_COUNTRY.es}. Desarrolla ${DEVELOPS.es} y ${EXPERIENCE.es}. Su trayectoria profesional comienza en ${since}.`,
          technologies: `Sus áreas de trabajo y las tecnologías que usa en cada una: ${capabilities}.`,
          projects: `Tiene casos de estudio documentados: ${names(caseStudies)}.`,
          languages: `Habla español e ${english.name.es.toLowerCase()}. Su nivel de ${english.name.es.toLowerCase()} es ${describeEnglishLevels(english.levels, 'es')}.`,
          availability: `Sí. ${AVAILABILITY.es}: puedes proponerle un proyecto o hablar de una oportunidad profesional.`,
          contact:
            'Puedes escribirle por email o por LinkedIn para proponerle un proyecto o hablar de una oportunidad profesional.',
        }
      : {
          who: `${profile.person.name} is a ${ROLE_TITLE.en} based in ${HOME_LOCATION_WITH_COUNTRY.en}. He develops ${DEVELOPS.en} and ${EXPERIENCE.en}. His professional experience goes back to ${since}.`,
          technologies: `His areas of work and the technologies he uses in each: ${capabilities}.`,
          projects: `He has documented case studies: ${names(caseStudies)}.`,
          languages: `He speaks Spanish and ${english.name.en}. His ${english.name.en} level is ${describeEnglishLevels(english.levels, 'en')}.`,
          availability: `Yes. ${AVAILABILITY.en}: you can propose a project or discuss a career opportunity.`,
          contact:
            'You can email him or message him on LinkedIn to propose a project or discuss a career opportunity.',
        }

  return [
    { id: 'quien-es', question: who!, answer: answers.who, links: [] },
    {
      id: 'tecnologias',
      question: technologies!,
      answer: answers.technologies,
      links: [],
    },
    {
      id: 'proyectos',
      question: projects!,
      answer: answers.projects,
      links: caseStudies.map((project) => ({
        label:
          language === 'es'
            ? `Leer el caso de estudio de ${project.title.es}`
            : `Read the ${project.title.en} case study`,
        href: getAlternatePaths(`/proyectos/${project.id}`)[language],
        external: false,
      })),
    },
    {
      id: 'idiomas',
      question: languages!,
      answer: answers.languages,
      links: [],
    },
    {
      id: 'disponibilidad',
      question: availability!,
      answer: answers.availability,
      links: [
        {
          label:
            language === 'es'
              ? 'Ir a la sección de contacto'
              : 'Go to the contact section',
          href: `${homePath}#contacto`,
          external: false,
        },
      ],
    },
    {
      id: 'contacto',
      question: contact!,
      answer: answers.contact,
      links: [
        {
          label:
            language === 'es'
              ? 'Escribir un email a Sergio'
              : 'Send Sergio an email',
          href: profile.links.mail,
          external: false,
        },
        {
          label:
            language === 'es'
              ? 'Ver el perfil de LinkedIn de Sergio'
              : 'View Sergio’s LinkedIn profile',
          href: profile.links.linkedin,
          external: true,
        },
      ],
    },
  ]
}
