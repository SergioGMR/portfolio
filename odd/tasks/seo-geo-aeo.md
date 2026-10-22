# SEO, GEO and AEO improvements — round 2

## Objective

Apply the 2026-10-22 review findings: richer entity data for search and AI
answers, answer-ready home content, and remaining technical SEO details.
Allow `Google-Extended`.

## Authorization

- 2026-10-22: the user approved preparing this plan for review points 2–10 and
  asked to allow `Google-Extended`.
- 2026-10-22 follow-up: `SergioGMR` is the user's nickname and the legal name
  is Sergio Morales Rodríguez. The user asked for WebP case-study images, for
  the CVs to carry the correct name and no year, and confirmed the «El Ricón»
  typo.
- 2026-10-22: the user approved the plan, including
  `bun install --frozen-lockfile`, with WebP social cards.
- Not authorized: commits, pushes, deploys, provider/dashboard changes.

## Decisions

- **D1 Crawlers:** `Google-Extended` gets the same group as other allowed
  agents (`Allow: /`, `Disallow: /api/`). This also allows Gemini training and
  grounding. Other training opt-outs stay unchanged. Update
  `docs/seo-measurement.md`.
- **D2 Schema shape:** keep exactly one JSON-LD object per page, because the
  verifier compares one script with `metadata.schema`. Use nesting: home
  `ProfilePage.isPartOf` is the `WebSite` node. Discarded: `@graph` (breaks the
  top-level type contract with no semantic gain) and a second script (verifier
  and `LanguageMetadata` type changes).
- **D3 Person:** one builder, embedded in full wherever it is referenced (home
  `mainEntity`, case-study `author`/`creator`, terms `author`), with the same
  `@id`. Fields: `name` (legal name), `alternateName: "SergioGMR"` (nickname;
  Google documents `alternateName` as a public handle), `url`, unchanged
  `jobTitle`, `description` in the page language, `image`, `homeLocation`
  (Las Palmas de Gran Canaria, ES), `knowsAbout` (deduplicated capability
  technologies), `knowsLanguage` (`es`, `en`), `alumniOf` (from
  `education[0]`), `sameAs`. No email in the schema.
- **D4 Person image:** publish `src/assets/me_laptop.avif` (an illustrated
  avatar, not a photo) as stable `public/sergio-morales-avatar.png` (500×500).
  Swap it for a real photo if the user provides one.
- **D5 Dates:** a per-path `PAGE_LAST_MODIFIED` map in `src/lib/site.ts`, using
  real dates from git history. Pages changed by this work get the
  implementation date. The sitemap emits `loc` + `lastmod` only; Google ignores
  `changefreq`/`priority`. Home `ProfilePage.dateModified` uses the same
  source. Discarded: build-time git dates (shallow clones on Vercel).
- **D6 Case-study cards:** a per-project 1200×630 card via `astro:assets`
  `getImage` (cover). It is passed to `HeadSEO` with the actual
  width/height/type and a per-project `imageAlt`. Home and terms keep
  `/og.jpg`. **Format: WebP** (user decision, 2026-10-22, after being told
  that visitors' browsers never download `og:image` and that community reports
  say LinkedIn WebP previews fail; LinkedIn publishes no official spec).
  `og:image:type` is `image/webp`. On-page case-study images stay AVIF.
- **D7 Head cleanup:** `twitter:*` use the `name` attribute; remove the
  duplicate `googlebot` meta; add `og:locale:alternate`.
- **D8 Icons:** add `/favicon.ico` (32), `/favicon-96x96.png` and
  `/apple-touch-icon.png` (180), generated from the existing 128px logo. Keep
  the AVIF icon. Upscaling 128→180 is an accepted risk.
- **D9 Headings:** the H1 wraps the name and the headline in two spans that
  keep the current visual classes. In Education/Languages, the `h2` becomes the
  section label and the value becomes an `h3`.
- **D10 FAQ:** a visible bilingual section before contact (`h2` plus one `h3`
  per question). Answers come only from existing profile data (see the draft).
  No `FAQPage` schema: Google limits FAQ rich results to government and health
  sites.
- **D11 CV aliases:** delete the byte-identical `sergio-morales-2024-*.pdf`
  files. Astro `redirects` sends each to its canonical PDF with a permanent
  status. Unlike `vercel.json`, this lands in the adapter output and can be
  verified locally. Only the year-less canonical names remain.
- **D12 Typo:** «I.E.S. El Ricón» → «I.E.S. El Rincón» in
  `professional-profile.ts`, its test, `docs/cv/*.html` and both PDFs.
- **D13 CV PDFs:** regenerate both PDFs from `docs/cv/*.html` with the local
  Playwright Chromium (`~/Library/Caches/ms-playwright/chromium-1234`;
  no system Chrome is installed). Set the PDF metadata: Title (as now), Author
  and Creator to «Sergio Morales Rodríguez», with no browser user agent. Add a
  reproducible, dependency-free `scripts/build-cv-pdfs.ts` with a test, and
  update `canonicalPdfSha256`. A new dependency (for example `pdf-lib`) needs
  separate authorization.

### Discarded

- `llms.txt`: already discarded in `docs/seo-measurement.md`.
- Case-study pages for showcase projects: they need new factual content from
  the user.
- Blocking `Applebot-Extended`/`Meta-ExternalAgent`: not requested.
- Non-SEO findings (logo alt, 404 `lang`, `X-XSS-Protection`, stale configs):
  follow-up.

### FAQ draft (answers derived from `PROFESSIONAL_PROFILE`)

1. ES «¿Quién es Sergio Morales Rodríguez?» / EN "Who is Sergio Morales
   Rodríguez?" — Tech Lead Full Stack based in Las Palmas de Gran Canaria
   (Spain); builds web applications and APIs with Laravel; coordinates
   development and DevOps teams.
2. «¿Con qué tecnologías trabaja?» / "Which technologies does he work with?" —
   capability labels with their technologies.
3. «¿Qué proyectos ha desarrollado?» / "What projects has he built?" — case
   studies (linked) and showcase names.
4. «¿Qué idiomas habla?» / "Which languages does he speak?" — Spanish and
   English (B2 comprehension, B1 production).
5. «¿Cómo contactar con Sergio?» / "How can I contact Sergio?" — email or
   LinkedIn, to propose a project or discuss a career opportunity.

## Units and TODO

The units run one at a time: they share `scripts/verify-portfolio-output.ts`,
`tests/built-page-runtime.test.ts` and the `dist/` build output.

- [x] **T0** — Parent. Installed with `bun install --frozen-lockfile` (local
      Bun 1.4.3; `packageManager` says 1.4.2). Baseline at `9148947`:
      `bun run test` **206 pass / 0 fail / 1767 expectations**; `bun run check`
      0 errors/warnings/hints; `format:check` passes. No pre-existing failures.
- [x] **E1 result** — gates: `bun run test` **239 pass / 0 fail / 3563
      expectations**; `check`, `format:check` and `build` pass.
  - `.vercel/output/config.json` has two 301 routes `^/sergio-morales-2024-{es,en}\.pdf$`
    pointing to the canonical PDFs, ahead of `filesystem`; no stub HTML.
  - The PDFs were regenerated with the Playwright `chromium_headless_shell`
    (Chromium 151); the full Chrome for Testing hung with `--print-to-pdf`.
    Info Author/Creator «Sergio Morales Rodríguez» (NFC), Title unchanged, no
    `HeadlessChrome`/`Mozilla/` bytes left (the old Info was blanked in place).
    Each PDF is 1 A4 page; size grew from about 45 KB to about 106 KB because
    macOS Arial is embedded.
  - New hashes: ES `9dcc01b4…3cc9`, EN `f3ca1cf2…af76`. Regenerating changes
    only the creation/modification seconds: re-run `bun run cv:build` and
    update `canonicalPdfSha256`.
  - The parent compared `scratchpad/cv-compare/old|new-es-p1.png`: same layout,
    slightly heavier headings, «El Rincón».
- [x] **E1** — `ejecutor`, after T0. Crawling, indexing and CVs: D1, D5 (map
      and sitemap), D11, D12, D13. Files: `public/robots.txt`,
      `tests/crawler-policy.test.ts`, `docs/seo-measurement.md`, `src/lib/site.ts`,
      `src/pages/sitemap.xml.ts`, `astro.config.ts`, all four `public/*.pdf`,
      `docs/cv/*.html`, new `scripts/build-cv-pdfs.ts` and its test, the verifier
      and its test, `tests/site.test.ts`, `src/lib/professional-profile.ts`
      (typo only) and its test. The parent visually compares the old and new PDF
      pages before accepting.
- [x] **E2 result** — gates: `bun run test` **263 pass / 0 fail / 4131
      expectations**; `check`, `format:check` and `build` pass.
  - `createPerson(language)` is embedded in full in home `mainEntity` and in
    case-study/terms `author`; home `author` stays an `@id` reference. The home
    page has `isPartOf` WebSite, and every page has `dateModified`.
  - `twitter:*` use `name=`; `googlebot` is removed; `og:locale:alternate` is
    added; four icon links.
  - Avatar PNG 500×500 at 83 KB; `favicon.ico` 32×32 (PNG payload);
    96×96 and 180×180 PNGs.
  - WebP cards: jauntjar 1200×630 (22 KB); todo-lux and basuraleza 900×480
    (29/17 KB), because Astro `withoutEnlargement` keeps the source size; the
    real dimensions are declared and verified.
  - The parent spot-checked the built head and JSON-LD of `/` and
    `/proyectos/todo-lux`.
  - Notes: `knowsAbout` comes from the capability data as is (it includes
    "Astro 7" and the leadership labels); the transparent corners of the
    apple-touch-icon render black on iOS.
- [x] **E2** — `ejecutor`, after E1. Head and structured data: D2, D3, D4, D5
      (`dateModified`), D6, D7, D8. Files: `src/lib/page-metadata.ts`,
      `src/components/HeadSEO.astro`, `BasePage.astro`, `CaseStudyPage.astro`,
      `src/lib/language-client.ts` (types only, if needed), new public icons and
      avatar, the verifier, `tests/page-metadata.test.ts`,
      `tests/built-page-runtime.test.ts`, `tests/language-client.test.ts`.
- [x] **E3 result** — gates: `bun run test` **295 pass / 0 fail / 4635
      expectations**; `check`, `format:check` and `build` pass.
  - The H1 has two block spans and an sr-only `", "` inside the name span (a
    `prettier-ignore` keeps the whitespace from changing); its text is
    «Sergio Morales Rodríguez, Tech Lead Full Stack. …».
  - Education/Languages: label `h2`, value `h3`.
  - `src/lib/profile-faq.ts` holds the 5 Q&As derived from the profile; the
    `FaqSection` renders them full width before contact (mobile order: FAQ →
    contact).
  - `assertHeadingOrder` covers all indexable pages; the terms pages already
    comply.
  - Screenshots in `scratchpad/e3-shots/`: desktop ES/EN and mobile EN are
    pixel-equivalent in the hero/education area; the mobile ES differences
    match the animation timing. The parent checked the hero, the FAQ and the
    education line («El Rincón»).
  - Note: in the Spanish FAQ, the "Coordinación técnica" items stay in English
    because the capability data is in English.
- [x] **E3** — `ejecutor`, after E2. Home content: D9, D10. Files:
      `HeroSection.astro`, `EducationLanguagesSection.astro`, new
      `sections/FaqSection.astro`, `HomePage.astro`,
      `src/lib/professional-profile.ts` and its test,
      `tests/built-page-runtime.test.ts`, the verifier.
- [x] **R1** — `revisor`, after E3. Independent review of the full diff.
      **APPROVED**, no blockers or majors; it reran the gates with 295 pass /
      0 fail. It independently validated the PDF xref offsets and the trailer.
  - Minors:
    1. The Person description says «coordina» (present tense), but the DevOps
       coordination ended in 2024.
    2. The script builds paths with `URL.pathname`, not `fileURLToPath`.
    3. The timeout can still hang (SIGTERM only, stderr wait).
    4. `CHROME_PATH` is shared with Lighthouse, and the test timeout equals
       the script's.
  - Nits:
    - Acceptance said JPEG (fixed by the parent).
    - The docs still say "social JPEG".
    - The `PAGE_LAST_MODIFIED` comment.
    - The crawler test does not list ClaudeBot.
    - «portafolio» wording.
    - Duplicated image-header parsers (deferred).
  - The parent confirmed macOS Arial has `fsType` 8 (editable embedding
    allowed).
- [x] **F1** — `ejecutor`. Fix R1's minors 1–4 and the nits except the parser
  deduplication. Gates: `bun run test` **303 pass / 0 fail**; `check`,
  `format:check` and `build` pass; PDF md5 unchanged.
  - New `src/lib/profile-summary.ts` shares the role, location and clauses
    between the Person description and the FAQ; the description now says
    «tiene experiencia coordinando».
  - `CV_CHROME_PATH`; `fileURLToPath`; timeout with SIGTERM → SIGKILL and an
    injectable timeout (the RED proved the old code leaked a process that
    ignored SIGTERM).
  - Deviation: the executor ran `prettier -w .`, which reformatted six
    unrelated `odd/tasks/portfolio-*.md`, plus `uploadimg-desktop.md` (which
    holds pre-existing user changes) and this plan. The classifier denied the
    executor's revert; it is surfaced to the user, not reverted by the parent.
- [x] **R2** — `revisor`. Targeted re-review of the F1 changes:
  **APPROVED**. The PDF hashes equal the pins.
  - Follow-up (Low): kill the Chromium process group or catch `rm` errors in
    `finally`, so a helper process cannot mask the timeout error.
  - Nit: clear the 1s stderr-drain timer.
- [x] **T9** — Parent. Final gates; Lighthouse CI if Chrome is available;
      validation ledger; close this TODO.
  - Final gates, run by the parent: `bun run test` **303 pass / 0 fail**;
    `check` 0 errors/warnings/hints; `format:check` passes; `build` and
    `verify:output` pass. The "performance 0.89" lines in the test log are
    Lighthouse-script test fixtures, also present in the baseline.
  - Lighthouse CI with Playwright Chrome for Testing 151 (`CHROME_PATH`), 5
    mobile runs:
    - Base `9148947` (clean worktree): LCP median **1430.8 ms**, FCP 905.8 ms,
      all categories 1.
    - Current working tree: LCP **1579 ms**. Cause: Tailwind v4 automatic
      source detection scans the untracked, non-ignored `.agents/` (skill docs
      full of class examples). The CSS grows from 36.4 KB to 53.1 KB locally
      only.
    - Changes applied to a clean worktree (no `.agents/`): LCP **1429.8 ms**,
      FCP 904.8 ms, all categories 1, CSS 36.6 KB. No regression from this
      work. The LCP warning (budget 1200 ms) is pre-existing.
  - Follow-up: exclude `.agents/` from Tailwind (`@source not`) or ignore it in
    git, so local builds match production.
  - NOT_RUN: deploy, Rich Results Test / Schema validator, LinkedIn/X previews
    of the WebP cards, Linux CI on Bun 1.4.2.

Each `ejecutor` follows strict TDD: changed expectations RED first, then
GREEN, without weakening existing assertions.

## Acceptance

- `bun run test`, `bun run check`, `bun run format:check` and `bun run build`
  pass, with no failures beyond the baseline.
- `robots.txt` allows `Google-Extended`; every other opt-out is intact.
- Every indexable page has one JSON-LD object with the enriched Person and the
  stable `@id`. Home also has the `WebSite` node and `dateModified`.
- The sitemap has 12 URLs, each with a valid `YYYY-MM-DD` `lastmod`, and no
  `changefreq`/`priority`.
- Case studies declare a per-project WebP card whose real dimensions match its
  meta tags.
- `twitter:*` use `name`; there is no `googlebot` meta;
  `og:locale:alternate` is present.
- The new icon files exist in `dist` and are linked from the head.
- Each page has one H1, and the home H1 contains the name and headline.
  Heading levels do not skip.
- The FAQ is visible in both locales as single-language HTML, with facts
  matching the profile.
- The 2024 PDF URLs permanently redirect (adapter config) to the canonical
  PDFs; the alias files are absent.
- No source, CV HTML or PDF text contains «El Ricón». The PDF Info has Author
  and Creator «Sergio Morales Rodríguez» and no user agent. The layout stays on
  one A4 page per original page.

## Risks

- The H1 is the measured LCP element; the visual output must stay identical.
  Compare Lighthouse CI.
- Google may not use a nested `WebSite` for site names. Check with the Rich
  Results Test after deploying (NOT_RUN locally).
- `getImage` may not enlarge 900px sources; in that case, declare the real
  output dimensions.
- Social networks keep cached cards.

- The originals were rendered by Linux HeadlessChrome; a macOS render with
  real Arial may shift line breaks slightly. Mitigation: the visual comparison
  in E1.

## Open questions

- Availability and years of experience are excluded from the FAQ until the
  user provides them.
