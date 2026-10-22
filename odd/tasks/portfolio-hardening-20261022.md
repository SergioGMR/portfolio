# Portfolio hardening and follow-ups — 2026-10-22

## Objective

Apply the pending technical follow-ups from the SEO/GEO/AEO round
(`odd/tasks/seo-geo-aeo.md`), plus the user's content decisions.

## Authorization

2026-10-22 user instructions:
- Ignore `.agents/` in git.
- Apply the pending technical improvements: Tailwind scanning, the CV script
  process handling, the logo alt, the 404 language, `X-XSS-Protection` + CSP,
  and the stale configs, `@tailwindcss/postcss`, `aceZone/tos.md` and the
  `package.json` typo.
- Take availability/experience for the FAQ from existing data.
- Keep the avatar (already in place).
- Improve the Todo-Lux/Basuraleza social cards to 1200×630.

Removing the `@tailwindcss/postcss` dependency is included in this
instruction. Not authorized: commits, pushes, deploys.

Diff baseline for this batch: a snapshot tree of the working state before it
starts, `9283ec01ed4d90347002f3652dabd829453bb5c3` (written with a temporary
index; no refs or real index touched). Review with
`GIT_INDEX_FILE=<tmp> git add -A && GIT_INDEX_FILE=<tmp> git diff 9283ec01`.

## Decisions

- **H1 `.agents/`:** add to `.gitignore`. Tailwind v4 skips gitignored files,
  so a separate `@source not` is unnecessary; verify the CSS size returns to
  about 36.6 KB.
- **H2 404 language:** no change. Correction to the earlier review: the 404
  content is English, so `lang="en"` is correct.
- **H3 Security headers:**
  - Remove `X-XSS-Protection` (deprecated; the recommendation is to omit it).
  - Add a CSP through Astro 7 stable `security.csp`, which emits a hashed
    `<meta http-equiv>`. `script-src`/`style-src` include `'self'` for bundled
    files and the production-only same-origin Vercel Analytics script.
  - Every executable inline script must be hashed (add explicit hashes if
    Astro does not hash `is:inline`).
  - JSON-LD data blocks are not executed.
  - Add only directives that cannot break the site (for example
    `object-src 'none'`, `base-uri 'self'`). `frame-ancestors` cannot be set
    in a meta tag; `X-Frame-Options: DENY` stays.
  - Discarded: a header CSP in `vercel.json` (it would need per-page hashes;
    `vercel.json` is not in the adapter output).
- **H4 Stale files:**
  - Delete `netlify.toml`, `tailwind.config.ts` (unused: v4 has no
    `@config`), `postcss.config.cjs` and `aceZone/tos.md` (an old draft with a
    `[fecha]` placeholder; the content lives in `AceZoneTerms.astro`).
  - `bun remove @tailwindcss/postcss`.
  - Fix the README project-structure lines (`tailwind.config.js`,
    `astro.config.mjs`).
  - `package.json` description: «peofiles» → «profiles».
- **H5 Logo:** `alt=""` on the header logo, because the link already has the
  text «SergioGMR».
- **H6 CV script:**
  - Spawn Chromium detached and kill its whole process group on timeout.
  - A cleanup `rm` failure must not mask the original error.
  - Clear the stderr-drain timer.
- **H7 Availability/experience** (from data):
  - The footer «Disponible para colaborar» / "Open to collaborate" and the
    code bento `$status = "Available"` move to one shared constant in
    `profile-summary.ts`, used by the footer and the FAQ.
  - The experience start comes from the earliest experience `startDate` in
    the profile (2020).
  - The FAQ adds «¿Está disponible para nuevos proyectos?» / "Is he available
    for new work?".
  - The "who" answer adds «con experiencia profesional desde 2020» / "with
    professional experience since 2020".
  - Do not claim a total number of years: the history has gaps.
- **H8 Social cards:**
  - Recapturing the live sites is discarded: Todo-Lux was redesigned and
    Basuraleza shows a cookie modal, so new captures would misrepresent the
    delivered work.
  - Instead, add dedicated 1200×630 social sources (sharp lanczos3 cover
    upscale, ×1.33) for todo-lux and basuraleza, used only for `og:image`.
    On-page images stay unchanged.
  - All three cases then declare 1200×630.
- **H9 Showcase case-study pages:** pending a user decision. They need new
  factual content (context, contribution, development, deliverables).

## Units and TODO

Serialized where they share `dist/`, the verifier or built-page tests.

- [x] **G1** — `ejecutor`: H1, H3 (`X-XSS-Protection` only), H4, H5.
  - Gates: `bun run test` **307 pass / 0 fail**; `check`, `format:check` and
    `build` pass.
  - CSS 53,137 → **36,368 bytes** with `.agents/` gitignored.
  - Removed: the four stale files and `@tailwindcss/postcss` (`bun remove`,
    `bun.lock` updated).
  - `X-XSS-Protection` removed (asserted absent); logo `alt=""` (built test);
    README and the typo fixed.
  - `.prettierignore` still has a dead `.netlify/` line (harmless; left).
- [x] **G2** — `ejecutor`, started after G1 (in parallel with G3; disjoint
  files): H3 CSP.
  - `security.csp` with `'self'` + hashes; `default-src 'self'`,
    `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
    `img-src 'self' data:`, `font-src 'self'`.
  - `src/lib/csp.ts` hashes the `is:inline` bodies from the components (Astro
    does not hash them).
  - `verifyContentSecurityPolicy` runs on all 12 routes + the 404: every inline
    script/style hash present, no `on*=`/`style=`, no external
    `<script src>`.
  - Gates: `bun run test` **374 pass / 0 fail**; `check`, `format:check` and
    `build` pass.
  - Runtime CDP: **0 violations** on `/`, `/en`, `/proyectos/jauntjar`,
    `/wattly/tos`, `/en/wattly/tos` and the 404. Theme, language and reveal
    work. The negative control is blocked.
  - The production Analytics bootstrap is hashed (checked with a
    `VERCEL_ENV=production` scratch build); loading the script file needs a
    real deploy.
  - Found: `<meta charset>` ends at byte 1024 (pre-existing; the theme script
    and preloads come before it). `data:` in `img-src` is unused.
- [x] **G4** — `ejecutor`, after G2: H7, H8 + H10 (charset first) + H11 (drop
  `data:`).
  - Gates: `bun run test` **392 pass / 0 fail**; `check`, `format:check` and
    `build` pass.
  - `AVAILABILITY` is shared by the footer and the FAQ; the FAQ has 6 items;
    the year comes from the earliest experience (2020).
  - Social sources: `src/assets/social/{todo-lux,basuraleza}.png`, 1200×630
    (`bun run social:build`). All cards are 1200×630 WebP (40/24/22 KB).
  - The charset meta is the first head element (bytes 37–59), checked by
    `verifyHeadPreamble`.
  - `img-src 'self'`; no `data:` in `dist`.
  - CSP runtime: 0 violations; negative controls blocked.
  - Parent edit (TDD RED 26/1 → GREEN 27/0): the ES "who" answer said «tiene
    experiencia» twice; it now reads «Su trayectoria profesional comienza en
    2020.» The parent viewed the todo-lux card; acceptable.
- [/] **RV** — `revisor-critico` (CSP and headers) and `revisor` (the rest),
  after G4, on the frozen scope.
  - `revisor`: **APPROVED**. Minors:
    - The CV signal forwarders are removed before `await termination` (a
      Ctrl-C window of about 3 s).
    - `build-social-sources.test.ts` uses `URL.pathname`.
  - Nits: guard the SIGKILL with `groupExists`; no SIGHUP test; the
    empty-pid-file read window; cleanup errors dropped when a `cause` already
    exists; the bento `"Available"` is intentionally kept (documented in
    `profile-summary.ts`).
  - `revisor-critico`: **CHANGES_REQUESTED**, verifier only. The shipped CSP
    is strong:
    - 0 violations on 13 pages in both the normal and the production builds;
      the production Analytics bootstrap is hashed; beacons are same-origin;
      the negative controls are blocked.
    - M1: the "meta in head" check is token-based; a stray element or text
      before the meta moves it to `<body>` and the browser ignores the CSP
      while the verifier passes.
    - M2: only `script-src`/`style-src` are allowlisted; `*-elem`/`*-attr`
      `unsafe-inline` or `*` would pass.
    - L1: script-type normalization (trim, `livescript`, `importmap`,
      `speculationrules`).
    - L2: `isSameOriginScript` with backslash/tab.
    - L3: CRLF normalization in `csp.ts`.
    - L4 (info): `vercel({ staticHeaders: true })` can emit per-route CSP
      headers (covers byte 0, `frame-ancestors`, reporting). The plan's reason
      for rejecting a header CSP was wrong for this adapter. Kept as a
      follow-up decision.
- [x] **F2** — `ejecutor`: M1, M2, L1–L3 + the revisor minors (forwarder
  timing, social test `fileURLToPath`, SIGKILL guard). Then a targeted
  `revisor-critico` re-review.
  - Gates: `bun run test` **469 pass / 0 fail**; `check`, `format:check` and
    `build` pass; CV tests 31/31 in 3 of 3 runs.
  - Verifier RED 112/37 → GREEN 150/0.
  - `*-elem`/`*-attr` are rejected outright; every directive allows only
    `'self'`, `'none'` and hashes; duplicate directives are rejected.
  - Head prefix allowlist before the CSP meta (M1).
  - Script types normalized (L1); `new URL()` origin check (L2); CRLF
    normalized (L3).
  - The CV forwarders are removed just before `removeDirectory`; SIGKILL is
    guarded.
- [x] **R-F2** — `revisor-critico` targeted re-review: **APPROVED**.
  - All 23 earlier probes behave correctly; the policy is byte-identical; the
    normal and production builds pass; no regressions.
  - Low residuals (none exploitable today), moved to C1 part B in
    `odd/tasks/showcase-case-studies.md`:
    - R1: content between `<html>` and `<head>` drops the CSP; the verifier
      misses it, but CI's built-page test catches it.
    - R2: a stray `</body>`/`</br>` or self-closing non-void elements in the
      head prefix.
    - R3: the CSP `content` attribute is read raw (entities).
    - R4: `<base>` and cross-origin `<link>` are allowed before the meta.
    - The CV tests leave empty `cv-chrome-*` dirs when simulating a cleanup
      failure.
- [x] **TZ** — after C1 (shared gates). Closed with the final gates recorded
  in `odd/tasks/showcase-case-studies.md` (CZ): 610 pass, check 0/0/0, build
  OK, Lighthouse 100 ×4, LCP 1436 ms ≈ base.
  - Follow-ups:
    - A header CSP via `vercel({ staticHeaders: true })` (covers byte 0,
      `frame-ancestors`, reporting).
    - The `imagesrcset` low.
    - Verify Analytics under the CSP after deploy.
    - The Duellum `/r/<token>` 500 in production.
- [ ] **TZ** — Parent: final gates, browser check without CSP violations,
  Lighthouse on a clean worktree, close.
- [x] **G3 result (first pass)**:
  - Detached spawn plus process-group SIGTERM → SIGKILL.
  - Injectable `removeDirectory`; cleanup errors attach as `cause` and do not
    mask the original error.
  - The drain timer is cleared.
  - Focused tests **26/26** across 3 runs (RED 22/4).
  - Follow-up requested: SIGINT/SIGTERM forwarding (detached broke Ctrl-C)
    and catching errors in the timer callback.
  - Follow-up done:
    - SIGINT/SIGTERM/SIGHUP handlers, active only during the render, SIGKILL
      the group, clean the profile and re-raise.
    - Listeners are removed on every path.
    - Errors in the timer callback (for example EPERM) become the timeout's
      `cause`; injectable `killProcessGroup`.
    - Focused tests **30/30** across 3 runs (RED 27/3); no leftover processes.
- [x] **G3** — `ejecutor`, in parallel with G1 (disjoint files; focused tests
  only, no full build): H6.

## Acceptance

- `bun run test`, `bun run check`, `bun run format:check` and `bun run build`
  pass; no `prettier -w .` (format only the touched files).
- The local CSS is about 36.6 KB with `.agents/` present but ignored.
- Every page has one CSP meta that covers every executable inline script and
  style. In the browser, the built preview shows no CSP violations on `/`,
  `/en`, a case study and a terms page; theme, language links, reveal
  animations and reduced motion still work. No `X-XSS-Protection` remains.
- The removed files and dependency are gone, nothing references them, and the
  lockfile is updated with `bun remove`.
- The CV script's timeout kills the process group; the tests cover the
  masking case.
- The FAQ availability/experience facts are derived from the data; the footer
  and the FAQ share one source.
- All case-study cards are 1200×630 WebP, with verified dimensions.

## Risks

- A CSP meta tag applies only after it is parsed: the theme script at the top
  of `<head>` runs before it, so hash it anyway for correctness.
- Vercel Analytics runs only in production: a local build cannot exercise it.
  Check it after deploy (NOT_RUN locally).
- Upscaled cards are slightly softer.
