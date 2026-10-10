# CLAUDE.md

## Commands

```bash
bun dev               # dev server at :4321
bun run check         # Astro/TypeScript checks
bun run test          # Bun tests; includes a production build
bun run build         # static build and output verification
bun run preview       # preview the built site
bun run format:check  # check formatting
bun run format        # format files
```

Package manager: **Bun 1.4.2**. Node **>=22.19.0**; see `package.json`.

## Architecture

Astro 7 static output on Vercel. Pure Astro components and Tailwind CSS v4
through the Vite plugin. Active theme tokens are in `src/styles/globals.css`.

### Content and languages

- `src/lib/professional-profile.ts`: professional profile and bilingual content.
- `src/lib/constants.ts`: exported portfolio data.
- `src/lib/site.ts`: site and locale routing helpers.
- `src/lib/language-client.ts`: browser language navigation.
- `src/components/LanguageService.astro`: initializes the browser language code.
- `src/components/LangText.astro`: shared bilingual text rendering.

Spanish and English have separate routes (`/` and `/en/`). Keep both locales
consistent when editing content. `src/lib/language.ts` is a legacy module with
no active consumers; do not treat it as the current translation store.

### Theme

`ThemeToggleLite.astro` controls the `.dark` class on `<html>`. Theme variables
such as `--foreground`, `--background`, and `--primary` contain HSL components;
use `hsl(var(--primary))` when referencing them as CSS colors.

### Layout

```text
BasePage.astro -> document, HeadSEO, global styles
  PageShell.astro -> header, main, footer, scroll observer
    page and section components
```

`src/components/pages/` holds shared pages; `src/components/sections/` holds
home-page sections. Route files under `src/pages/` select the page and locale.

### Scroll animations

`PageShell.astro` uses an IntersectionObserver for `data-animate` elements and
optional `data-animate-delay` values. It reveals elements with opacity/transform
transitions. Preserve reduced-motion behavior.

### Sitemap and validation

`src/pages/sitemap.xml.ts` generates the sitemap at build time. Output checks
live in `scripts/verify-portfolio-output.ts`; compiled-page behavior tests live
in `tests/built-page-runtime.test.ts`. Tests/build may write `dist/` and generated
Astro files; formatting checks use a cache.
