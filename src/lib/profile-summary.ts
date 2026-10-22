import type { Language } from './language-client'

/**
 * Wording shared by the Person JSON-LD description (`page-metadata.ts`) and the
 * "who is" FAQ answer (`profile-faq.ts`), so the two cannot drift apart.
 * Coordination is stated as experience, not a current role: the DevOps
 * coordination role ended in 2024.
 */

export const HOME_LOCATION = 'Las Palmas de Gran Canaria'

export const HOME_LOCATION_WITH_COUNTRY: Record<Language, string> = {
  es: `${HOME_LOCATION} (España)`,
  en: `${HOME_LOCATION} (Spain)`,
}

export const ROLE_TITLE: Record<Language, string> = {
  es: 'Tech Lead Full Stack',
  en: 'Full Stack Tech Lead',
}

/** What he builds, as the object of "develops". */
export const DEVELOPS: Record<Language, string> = {
  es: 'aplicaciones web y APIs con Laravel',
  en: 'web applications and APIs with Laravel',
}

/** Past coordination work, matching the hero copy. */
export const EXPERIENCE: Record<Language, string> = {
  es: 'tiene experiencia coordinando equipos de desarrollo y DevOps',
  en: 'has experience coordinating development and DevOps teams',
}

/**
 * Availability label shown in the footer and quoted by the "available for new
 * work" FAQ answer, so both read the same. The code sample in the bento card
 * keeps its own `"Available"` string: it is a code snippet, not site copy.
 */
export const AVAILABILITY: Record<Language, string> = {
  es: 'Disponible para colaborar',
  en: 'Open to collaborate',
}
