import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

/**
 * Dedicated Open Graph sources for the case studies whose page images are
 * 900x480 (all of them except JauntJar). Astro's `getImage` never enlarges a source, so the cards would come
 * out 900x480 instead of 1200x630. These sources are the page images
 * upscaled (about 1.33x, lanczos3, cover) and are used only for `og:image`;
 * the on-page images are untouched. JauntJar needs none: its source is already
 * 1200x640.
 *
 * Reproduce with `bun run social:build`.
 */
export const SOCIAL_SIZE = { width: 1200, height: 630 } as const
/** Page image each social source is built from, relative to the repository root. */
export const SOCIAL_INPUTS = {
  'todo-lux': 'src/assets/experience/todo-lux.avif',
  basuraleza: 'src/assets/experience/basuraleza.avif',
  wattly: 'src/assets/projects/wattly.webp',
  tvradar: 'src/assets/projects/tvradar.webp',
  duellum: 'src/assets/projects/duellum.webp',
  uploadimg: 'src/assets/projects/uploadimg.webp',
  'uploadimg-desktop': 'src/assets/projects/uploadimg-desktop.webp',
} as const
export const SOCIAL_SOURCES = Object.keys(
  SOCIAL_INPUTS,
) as (keyof typeof SOCIAL_INPUTS)[]

const rootUrl = new URL('../', import.meta.url)

export async function buildSocialSource(
  input: string,
  output: string,
): Promise<void> {
  await mkdir(dirname(output), { recursive: true })
  await sharp(input)
    .resize(SOCIAL_SIZE.width, SOCIAL_SIZE.height, {
      fit: 'cover',
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9, palette: false })
    .toFile(output)
}

if (import.meta.main) {
  for (const id of SOCIAL_SOURCES) {
    const input = fileURLToPath(new URL(SOCIAL_INPUTS[id], rootUrl))
    const output = fileURLToPath(
      new URL(`src/assets/social/${id}.png`, rootUrl),
    )
    await buildSocialSource(input, output)
    console.log(`wrote ${output}`)
  }
}
