import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import vercel from '@astrojs/vercel/serverless'

// https://astro.build/config
export default defineConfig({
  site: process.env.CI
    ? 'https://sergiogmr.vercel.app/'
    : 'http://localhost:4321',

  output: 'server',
  build: {},

  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],

  adapter: vercel(),
})