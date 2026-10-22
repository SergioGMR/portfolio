import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { collectInlineScriptHashes } from './src/lib/csp'
import { SITE_URL } from './src/lib/site'

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

  output: 'static',
  trailingSlash: 'never',
  build: {},

  // Legacy year-stamped CV URLs; `vercel.json` is not copied into the adapter
  // output, so the redirects live here where they can be verified locally.
  redirects: {
    '/sergio-morales-2024-es.pdf': {
      status: 301,
      destination: '/sergio-morales-es.pdf',
    },
    '/sergio-morales-2024-en.pdf': {
      status: 301,
      destination: '/sergio-morales-en.pdf',
    },
  },

  // Hashed `<meta http-equiv>` policy; it only applies to built output, never to
  // `astro dev`. `resources` replace Astro's defaults, so `'self'` is listed.
  // `'self'` also covers the production-only `/_vercel/insights/script.js`.
  // Astro hashes the scripts and styles it processes (including the Vercel
  // Analytics bootstrap) but not `is:inline` scripts, which are hashed here.
  // `frame-ancestors` is ignored in a meta tag; `X-Frame-Options` covers it.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: {
        resources: ["'self'"],
        hashes: collectInlineScriptHashes(
          new URL('./src/components/', import.meta.url),
        ),
      },
      styleDirective: { resources: ["'self'"] },
    },
  },

  integrations: [],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({
    webAnalytics: { enabled: process.env.VERCEL_ENV === 'production' },
  }),
})
