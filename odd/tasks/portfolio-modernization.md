# Modernize the portfolio and assess its security

Migrate the supported dependency graph to current stable releases, remove
source-grounded AI-slop, and audit the resulting local source without probing
production or changing the portfolio's identity.

## Scope and authorization

- User explicitly authorized migration beyond Astro 6, security analysis,
  local vulnerability testing, and AI-slop reduction.
- Base: `1e4d9342c9f020cde5b0ccbafcd306e3e2b8ea1d`.
- Branch: `feat/portfolio-modernization-20261004`.
- Local package installation and work-unit commits are authorized.
- No push, PR, merge, deployment, external-target probing, provider mutation,
  or global Bun/Node upgrade.
- Preserve identity, real assets, contact/CV destinations, bilingual one-URL
  behavior, page routes, legal text, themes, and reduced-motion support.
- Preserve unrelated dirt byte-for-byte: `.atl/skill-registry.md`, `.gitignore`,
  `.mcp.json`, `CLAUDE.md`, `.atl/.skill-registry.cache.json`, `CLAUDE.md.backup`.
- Security findings authorize a report, not automatic source fixes.

## Execution policy

- Delegated direct: preparation spans multiple files; each implementation task
  needs analysis, source changes, and regression tests. One source writer.
- Strict TDD enabled by supplied `AGENTS.md`; runner `bun run test` / Vitest.
  Observe RED before behavior changes, then GREEN and REFACTOR.
- RDD globally off: do not enable it or launch native review. Read-only risk
  assessment plus independent verification and one parent spot-check.
- Delivery: `ask-on-risk`; previously selected session chain strategy
  `feature-branch-chain`. Future PR slices remain unauthorized and must be green.
- Forecast: 440-660 authored additions/deletions across DEP-01 and UI-01,
  plus audit recovery documentation. Generated lock changes counted separately.
  About 400 lines per local task is advisory, never code-golf; future PR policy
  is separate.
- Security audit uses the installed `security-audit` skill, a small-target
  `quick` profile with explicitly partial coverage, and external run artifacts.
  Execute target-controlled attack checks only if every required OS sandbox
  control is demonstrated; otherwise record the exact needs-validation gap.
  Never install/fetch tools or dependencies inside the audit run.

## Tasks

- [x] DEP-01 — Upgrade the supported stable dependency graph.
  Route: delegated; manifest, lock, compatibility tests and migration behavior.
  Targets: Astro 7.3.5, Vercel 11.0.11, Vite 8.3.2, Tailwind family 4.3.3,
  animations 1.0.2, sharp 0.35.5, Prettier 3.9.9, Astro formatter 1.1.0,
  Tailwind formatter 0.8.1. Already latest: check 0.9.10, Happy DOM 20.14.5,
  Vitest 5.0.3. Revalidate registry metadata before installation.
  Compatibility exceptions: TypeScript 6.0.3 because latest checker excludes
  TypeScript 7; Node types 24.19.1 to match fixed Node 24.21.0, not Node 26.
  Do not force unsupported peers or remove the checker. Bun remains 1.4.2.
  Files: package.json, bun.lock, tests/toolchain.test.ts; migration-only source
  corrections only when an observed diagnostic justifies them.
  Acceptance: frozen install and all gates green; four output pages retain
  routes, metadata, language behavior, Analytics and reduced motion.
  Rollback: this work unit's manifest, lock, tests and migration-only changes.

- [x] UI-01 — Remove bounded visual/copy/code AI-slop.
  Route: delegated; cross-template presentation and source-connected tests.
  Preserve-mode developer portfolio for recruiters and clients; retain real
  imagery, blue/glass identity and typography. Variance 6, motion 4, density 4.
  Remove decorative blobs, redundant technology strip, excessive micro-labels,
  unsupported index-derived role/project badges, repeated glass/card framing
  and decorative UTC pulse. Use concrete existing facts, consistent contact
  intent, simpler skill groups and featured project hierarchy.
  Add skip navigation, visible focus and viewport stability without legal or
  identity changes, invented claims, fake photography or extra dependencies.
  Files: index.astro, PageShell.astro, BasePage.astro, globals.css,
  tests/interface.test.ts; synchronize affected metadata if copy requires it.
  Acceptance: regression gates; ES/EN and light/dark at 390/768/1440px,
  keyboard/skip/controls checks, with unavailable evidence recorded honestly.
  Rollback: only this presentation/copy/template work unit and its tests.

- [ ] SEC-01 — Audit the frozen green source and document attack coverage.
  Route: delegated reconnaissance, hunters, coverage critic and independent
  candidate verification; parent owns shared audit artifacts.
  Cover browser inputs/sinks, serialization, routes/assets, build/CI/dependency
  trust boundaries and source-visible deployment controls. Do not label missing
  best practices or unobserved provider behavior as confirmed vulnerabilities.
  Local attack checks require offline OS enforcement, empty allowlisted env,
  read-only source/toolchain, scratch-only writes and resource/time limits.
  Acceptance: six audit phases or explicit incomplete terminal report;
  findings/coverage schema validators pass; confirmed findings independently
  verified, unknown deployment/sandbox facts recorded separately.
  No target source fixes within the audit. Commit only the repository recovery
  evidence after completing the report; external artifacts remain local.

## Verification and progress

Applicable ordinary implementation gates: `bun ci`, `bun pm ls --depth=0`,
`bun run format:check`, `bun run check`, `bun run test`, `bun run build`,
`git diff --check`, focused tests and built-output/browser regression checks.
Normalize owned files only before final verification; never run broad formatting
against protected dirt.

DEP-01 and UI-01 implementation and verification are complete; SEC-01 has not
started. Full
Engram mirror: `odd/portfolio-modernization/tasks`. Commit IDs, exact
RED/GREEN/check evidence, authored counts, audit paths and proof gaps will be
recorded per completed unit.

### DEP-01 completed evidence

Work-unit commit: `a2587ac757601d14d833ccd5396f14c575d6b1c5`.
Independent verification and the parent spot-check passed before commit.

- Revalidated all 16 packages against the public npm registry immediately before
  installation. Installed the planned Astro 7 graph, retaining TypeScript 6.0.3
  because `@astrojs/check` excludes TypeScript 7 and Node types 24.19.1 because
  the fixed runtime is Node 24.21.0. Bun remains 1.4.2.
- TDD RED: the new dependency-graph assertion failed with 1 failed/2 passed on
  the Astro 6 manifest. After installation exposed the legacy TypeScript config,
  `astro check` failed with 3 diagnostics: Astro package exports did not resolve
  under `moduleResolution: "node"`, cascading to two implicit-any errors. A
  focused config assertion then failed with 1 failed/3 passed.
- GREEN: changed only `moduleResolution` from `node` to `bundler`, without
  weakening strictness or suppressing diagnostics. The focused suite passed 4/4;
  `astro check` then covered 18 files with 0 diagnostics.
- Prettier 3.9.9 plus the Astro 1.1.0 plugin changed formatter output for seven
  clean-at-base Astro files. They were normalized mechanically with no intended
  content, identity, locale, theme, route, or motion behavior change.
- Final local gates passed: focused 4/4, frozen `bun ci`, 16 direct packages at
  intended versions, format check, 18-file Astro check with 0 diagnostics,
  full Vitest 15/15, and Astro build with 4 pages.
- Built-output Happy DOM inspection parsed all four pages, preserved their
  canonical URLs and bilingual metadata/schema payloads, found one Analytics
  loader per page, and found the expected visible ES/EN phrases after whitespace
  normalization. Sitemap and robots retained the three public routes and
  `https://sgmr.dev`; compiled CSS retained normal animation rules plus the
  reduced-motion override. No real-browser run is claimed for this dependency
  work unit.

- Independent verification repeated package inventory, format check, 18-file
  zero-diagnostic Astro check, 15/15 tests, four-page build and diff check. It
  confirmed lock/manifest/installed root specs and reproduced all seven Astro
  files byte-for-byte by formatting their base versions. Prior frozen `bun ci`
  proof was retained, not rerun. Parent spot-check: toolchain tests 4/4.
- Authored source count: 583 additions plus deletions; generated lock count:
  716. Formatter normalization accounts for 522 authored lines. The coherent
  migration exceeds the advisory task heuristic because the new formatter
  changes existing output; no artificial split or code-golf was used.
- Future delivery slice DEP-01 contains only `a2587ac`. The already-selected
  `feature-branch-chain` remains the intended strategy; no PR, push, merge or
  exception was authorized or created. Its honest authored size must be handled
  under ordinary PR policy before publication.
- RDD is globally off (`disabled/unmanaged`); assessment was unassessable/high
  because of untracked inventory. Independent verification supplied proof;
  no native review or fabricated approval was produced.
- CodeGraph initialization created untracked `.codegraph/`, then exploration
  timed out after 300 seconds. Bounded filesystem fallback was used. The index
  and all six protected unrelated dirty paths were excluded from the commit;
  protected hashes remained unchanged.

Next task: SEC-01 against the frozen green source.

### UI-01 completed implementation and verification evidence

Independent verification and parent spot-check passed; the source work-unit
commit identity is recorded below after commit creation.

- Design read: preserve-mode developer portfolio for recruiters and clients;
  variance 6, motion 4, density 4. Three internal layout references covered the
  minimum affected groups (hero, experience/skills, projects/contact). Generated
  references were inspected for layout only and were not copied into the
  repository or used to replace the existing portrait/screenshots.
- CodeGraph: the bounded read-only query produced no output after 60 seconds and
  was stopped rather than repeating the prior 300-second timeout. Exploration
  then used only the scoped source/test files.
- TDD RED: `bun run test -- tests/interface.test.ts` failed with 5 failed and
  1 passed before source implementation. GREEN: the focused suite passed 6/6.
  The first full suite then exposed one precise stale regression expectation:
  `tests/reduced-motion.test.ts` still required the intentionally removed
  decorative `animate-ping`; it was updated and the full suite passed 21/21.
- Candidate changes: open experience rows without index-derived status badges;
  three factual skill groups instead of the undifferentiated chip cloud; one
  lead-project hierarchy using all four existing screenshots; open about/contact
  composition; consistent Contact/Contacto intent; decorative blobs, redundant
  technology strip, repeated nested glass/card framing, project badges, and UTC
  pulse removed. Existing routes, assets, destinations, language storage,
  metadata/schema behavior, theme controls, and reduced-motion behavior remain.
- Accessibility/stability: working bilingual skip link targets focusable
  `#main-content`; visible keyboard focus is present on links and ring focus on
  both mobile select controls; body uses `100dvh` and clips horizontal overflow.
  Primary-action contrast is 5.42:1 in light mode and 5.88:1 in dark mode.
- Final local gates: focused interface tests 6/6; format check passed; Astro
  check covered 18 files with 0 diagnostics; full Vitest 21/21; build produced
  four pages; `git diff --check` passed. Built output retained the canonical
  URLs, one Analytics loader per page, and localized schema payloads.
- Browser proof: Microsoft Edge 154 against the local static preview with a
  fresh isolated profile. ES/light and EN/dark were checked at 390x844,
  768x1024, and 1440x900. Every matrix entry had zero HTML/body horizontal
  overflow and the expected persisted locale/theme. Keyboard Tab reached the
  skip link, language control, theme control, and contact control; Enter moved
  focus to `#main-content`. Reduced-motion emulation reported
  `animation-name: none`, no transforms, and visible reveal content. Full-page
  mobile and desktop screenshots confirmed the real media and responsive
  section layouts. Lighthouse was not installed and was not claimed.
- UI-01 authored count: 351 tracked additions, 412 tracked deletions, plus
  77 lines in the new focused test (840 additions plus deletions total).
  The coherent preserve-mode cleanup exceeds the advisory heuristic because it
  replaces repeated section/card markup rather than code-golfing it.
- Candidate files: `src/pages/index.astro`,
  `src/components/layout/PageShell.astro`,
  `src/components/layout/BasePage.astro`, `src/styles/globals.css`,
  `tests/interface.test.ts`, and the diagnostic-driven
  `tests/reduced-motion.test.ts`.
- All six protected unrelated file hashes matched their before values. The
  untracked `.codegraph/` index was not modified or staged.

- Independent verification: all ordinary gates passed again (18 checked files,
  zero diagnostics, focused 6/6, full 21/21, four built pages). Fresh isolated
  Edge `154.0.4258.53` passed all 12 ES/EN x light/dark x 390/768/1440 cases,
  including zero overflow, persisted controls, synchronized metadata/schema,
  first-focus skip link and main focus, control order, all real media, and 18
  visible reduced-motion elements with no animation or transform. The hidden
  inactive locale tree is intentionally excluded from visibility assertions.
- Parent spot-check: `bun run test -- tests/interface.test.ts`, 6/6. Candidate
  source hashes matched the independent verifier before commit. Legal sources,
  factual constants, language runtime, CVs and image/destination bytes are
  unchanged from DEP-01. Owned verifier browser/server/profile resources were
  removed. Lighthouse remains unavailable; local Insights 404s do not prove
  production Analytics behavior, only the preserved static loader contract.
- RDD remains globally off (`disabled/unmanaged`); risk assessment was
  unassessable/high due to untracked inventory. No native review was started.
- Running authored source total: DEP-01 583 plus UI-01 840 = 1,423, excluding
  generated lock and recovery-document lines. Future UI-01 delivery is a
  distinct slice from DEP-01 under the selected `feature-branch-chain`; no
  remote delivery or size exception is authorized. Resolve ordinary PR-size
  policy with honest coherent boundaries before any publication.

## Remaining work

- SEC-01 has not started: no security findings or attack coverage are claimed.
  Audit the frozen green source using the external quick-profile report and
  required sandbox checks. Source fixes and production probes remain excluded.
