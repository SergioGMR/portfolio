# Showcase projects as case studies — 2026-10-22

## Objective

Turn Wattly, TVRadar, Duellum, Uploadimg and UploadIMG - Desktop into full
bilingual case studies, with the same structure as JauntJar, Todo-Lux and
Basuraleza.

## Authorization

- The user asked for it ("Hazlo tú") and approved the Spanish content in
  `odd/tasks/showcase-case-studies-draft.md` (v2).
- The user also approved describing the Wattly price API only as a fallback
  own REST API, without naming its source.
- No commits/pushes/deploys.

## Decisions

- **S1 Data model:**
  - The five entries become `kind: 'case-study'`, with `summary`, `problem`,
    `responsibility`, `solution`, `result`, `tasks` and `technologies`.
  - The Spanish text comes verbatim from the approved draft. Section mapping:
    Contexto → `problem`, Mi participación → `responsibility`, Desarrollo →
    `solution` (prose), Entregables → `result`, Tareas → `tasks`.
  - The English text is a faithful, neutral professional translation.
  - Keep the existing card summaries, except UploadIMG - Desktop, which gets
    the adjusted summary.
  - With no showcase entries left, remove the `ShowcaseProject` type and its
    branches (YAGNI) and update the tests that pin showcases.
- **S2 SEO title:** replace the hard-coded «— Desarrollo con Laravel» with a
  per-project localized `titleFocus`:
  - JauntJar, Todo-Lux, Basuraleza and TVRadar: «Desarrollo con Laravel».
  - Wattly: «Aplicación web con Astro».
  - Duellum: «Aplicación web con React».
  - Uploadimg: «Servicio web con Astro».
  - UploadIMG - Desktop: «Aplicación de escritorio con Rust y Tauri».
  - English equivalents for each.
- **S3 Links:**
  - The `evidenceUrl` values stay as they are (demos), except UploadIMG -
    Desktop, which points to
    `https://github.com/SergioGMR/uploadimg-desktop/releases` (user request:
    download link).
  - Uploadimg links to its demo only (the local repo has no remote).
- **S4 Routes and indexing:**
  - `CASE_STUDY_IDS` grows to 8, so the sitemap has 22 URLs.
  - The new `PAGE_LAST_MODIFIED` entries are 2026-10-22.
  - Each page gets reciprocal hreflang, JSON-LD (WebPage + CreativeWork +
    breadcrumb + Person) and the verifier's case-study checks.
- **S5 Images:**
  - On-page images reuse `src/assets/projects/*.webp` (900×480).
  - Generate 1200×630 social sources for the five projects with
    `bun run social:build` (extend its list).
  - All cards are 1200×630 WebP.
- **S6 FAQ:** the "projects" answer lists all 8 case studies with internal
  links and drops the "otros proyectos" sentence when there are no showcases.
- **S7 Home cards:** all project cards link internally («Leer caso →») and show
  their technologies. The external `target=_blank` branch is removed.

## Units and TODO

- [/] **C1** — `ejecutor`, after F2 and its re-review (they share the verifier,
  the built-page tests and `dist/`): S1–S7, with strict TDD.
  - Part B: the verifier hardening R1–R4 from `revisor-critico` and the CV
    test temp-dir hygiene (see `portfolio-hardening-20261022.md`).
  - Result: `bun run test` **588 pass / 0 fail**; build 23 pages; 0 CSP
    violations on the new pages.
  - `ShowcaseProject` removed; required `titleFocus`; FAQ lists 8 cases; 7
    social sources.
  - Part B: R1–R4 plus the temp guard (RED 155/30 → GREEN 185/185).
  - Parent follow-up (TDD RED 22/3 → GREEN 25/0): the UploadIMG - Desktop
    title was 90/83 characters. `titleFocus` is now «App para macOS» /
    "macOS app" (63/58), with a new test capping all case-study titles at 65
    characters.
  - The parent also replaced 3 `await expect().rejects` tests with a
    `rejectionOf` helper; `check` is back to 0 hints.
  - Parent gates: **589 pass / 0 fail**; `check` 0/0/0; format OK; build and
    verifier OK; 22 sitemap URLs.
- [x] **CR** — `revisor`: factual check of each page against the approved
  draft, EN translation quality, SEO and indexing, accessibility. In
  parallel, `revisor-critico` re-checks Part B.
  - `revisor` **APPROVED**: the Spanish matches the draft (script compare);
    no scraping or mobile mentions; 16 unique titles of 56–63 characters; 22
    URLs; reciprocal hreflang; WebP cards 1200×630. Low:
    - 5 EN wording nits (one adds "evenly");
    - the React guard is removed from the whole profile;
    - no Wattly constraint test;
    - task periods are inconsistent.
  - `revisor-critico` **APPROVED**: R1–R4 closed; 23 pages with 0 violations
    and an identical policy. Low:
    - the regex prelude and end-tag scanners diverge from HTML tokenization
      (abrupt comments, `--!>`, `</style x>`, `<` in attribute values,
      `<html-x>`); this also risks false positives on legitimate content;
    - a `<link href>` before the meta is read raw (`&`);
    - the CV test guard can delete a concurrent run's dir.
- [x] **F3** — `ejecutor`: all of the above lows (last round; later lows are
  recorded as follow-ups).
  - Gates: `bun run test` **610 pass / 0 fail**; `check` 0/0/0; format and
    build pass.
  - A: lol-html sanitizing tokenization replaces the regex prelude/end-tag/
    charset scans (RED 188/14 → GREEN 202/0); `&` in a `<link href>` is
    rejected. Residual: a cross-origin `imagesrcset` on a preload `link`
    before the meta.
  - B: `tempRoot` option; per-test roots (CV tests 32/32 in 3 of 3 runs).
  - C: EN wording fixed; task periods removed; React, Wattly and
    trailing-period guards added.
- [x] **R-F3** — `revisor-critico`: final targeted re-review. **APPROVED**.
  - Every round-3 bypass is rejected; legitimate cases pass.
  - 23 HTML files with an identical policy; 0 violations in both the normal and
    the production builds.
  - The Spanish differs from the draft only in the removed task periods.
  - Follow-ups (low): a cross-origin `imagesrcset` on a preload `link` before
    the meta; a leading BOM is rejected (conservative).
- [x] **CZ** — Parent: final gates, a visual check of one new page in ES/EN,
  close.
  - Gates: `bun run test` **610 pass / 0 fail**; `check` **0 errors / 0
    warnings / 0 hints**; format OK; build and verifier OK; CSS 36,368 bytes.
  - Lighthouse CI (Chrome for Testing 151, 5 mobile runs): all four
    categories 1. LCP median 1436 ms (base `9148947`: 1430.8 ms, noise; the
    pre-existing warning has a 1200 ms budget). FCP 911 ms, TBT 0, CLS 0.
  - The `revisor` viewed the screenshots in `scratchpad/c1-shots/`.
  - NOT_RUN: a real Vercel deploy (Analytics under the CSP, live headers),
    Rich Results Test, social previews, Linux CI.

## Acceptance

- 22 sitemap URLs. The 5 new pages exist in ES and EN with one H1, a
  canonical, reciprocal alternates, valid JSON-LD and a 1200×630 WebP card.
- The SEO titles match each project's real stack.
- The Spanish text matches the approved draft exactly. The English is
  equivalent.
- Gates: `bun run test`, `check`, `format:check` and `build` pass, with no
  `prettier -w .`.

## Risks

- Resolved 2026-10-22: Duellum public result links returned 500 because the
  Vercel project had no env vars.
  - Added `PUBLIC_RESULT_ORIGIN`, `PUBLIC_RESULT_ACTIVE_KID` and
    `PUBLIC_RESULT_ACTIVE_KEY` (a generated 32-byte key, never printed) to
    production, then redeployed.
  - Verified: an unknown token returns 404; creating a result returns 201;
    the result page and `og.png` return 200.
  - The key is stored as `config` because Vercel rejects secrets named
    `PUBLIC_*`. Duellum's Vite exposes only `VITE_` and its client code never
    reads env, so the key stays server-side.
- Translation drift: the reviewer compares ES and EN.
