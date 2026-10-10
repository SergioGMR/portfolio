# Portfolio AI Slop corrections

## Goal and scope

The user requested correcting the three confirmed findings from
`portfolio-dev-main-sync-20261010.md`. Start: clean local `dev` at
`aee56b1b22ed9ff4c6a36c242d5a0ddfc208fe3b`; local `main` has the same commit.

1. Keep theme behavior and accessible control state working when browser
   storage reads or writes fail.
2. Correct HSL colors in both legal pages and remove the duplicated styling.
3. Remove the unused legacy language implementation and obsolete API/fixture
   remnants without changing current locale navigation.

Preserve current content, routes, SEO, CVs, real project assets, Solutec removal,
Tecandu experience, and reduced-motion behavior. The unconfirmed hidden-content
verifier hypothesis is outside this correction. No dependencies, installations,
provider operations, remote publication, or deployment are included.

Prior authorization to synchronize local `dev` and `main` remains in effect;
finish with the original checkout on `dev`. Only the parent performs Git writes.

## Ownership and dependencies

- [x] AS-F01 (parent): verify current Git state, instructions, dependencies, and
  the existing findings.
- [x] AS-F02 (executor): approved minimal design implemented after functional
  RED; 45 focused tests passed, including compiled theme/color regressions and
  current language behavior. Legacy code and duplicate styles removed.
- [x] AS-F03-V (parent): format and Astro checks passed; all 206 tests passed,
  including the production build and output verification.
- [x] AS-F03-R (independent reviewer): APPROVED; all three findings corrected,
  behavior coverage retained, no new regressions identified. Logs independently
  inspected; tests not redundantly rerun by the reviewer.
- [/] AS-F04 (parent): commit verified corrections, synchronize local main, and
  confirm the original checkout remains on dev. Depends on AS-F03-R.

The executor owns the theme component, both legal components, a small shared
legal stylesheet if needed, legacy/current language modules, and the existing
compiled-page/language tests. The parent owns this record and project guidance.
Tests/build share generated resources and must run sequentially. No writes run
concurrently with independent review.

## Approved implementation

- Theme: retain the existing dark default, hold the selected preference in
  memory, and guard only storage accesses. A failed write must not cause later
  system events to restore an older persisted preference.
- Legal styles: use one `src/styles/legal-content.css` import in both pages.
  Scope every selector beneath `.prose-tos`, including contact links, to retain
  the isolation formerly supplied by Astro component styles. Keep spacing and
  typography unchanged and wrap the existing color tokens in `hsl(...)`.
- Language: remove the proven unused legacy module and storage/serialization
  remnants; retain the active language component, routing helpers, JSON-LD
  escaping utility, and behavior assertions.
- Regression evidence: run real compiled theme scripts with storage failures
  and compute legal colors from emitted CSS in the existing DOM test harness.
  DOM simulation is not a real-browser visual check.

## Acceptance and validation

- Theme controls remain coherent when storage reads/writes throw; explicit
  choices and system changes remain usable without persistence.
- Both legal pages use valid colors under the existing HSL token contract.
- No consumers remain for removed code; current ES/EN navigation and fragments
  retain behavior and test coverage.
- Meaningful failing regression tests are observed before functional changes;
  cleanup does not add implementation-shaped tests or weaken expectations.
- Existing format, Astro checks, suite, and compiled-output validation pass.
- Independent review addresses any findings within this bounded scope.

Local validation passed in the complete worktree. The original checkout's
dependency directory is incomplete:
the first regression command failed in its build fixture because
`@fontsource/space-grotesk/latin-400.css` was absent. This is an environment
failure, not the functional RED. Missing tooling also includes `@types/bun`,
`lighthouse`, and `chrome-launcher`; no packages were installed.

Implementation and validation moved to the existing clean worktree at
`/Users/sergiogmr/portfolio-worktrees/main-integration-20261004`, branch
`fix/portfolio-ai-slop-20261010`, from the same baseline. It has the existing
complete dependency set, Bun 1.4.2, and Node v26.11.0. New regression tests were
copied and verified byte for byte before restoring only our test edits in the
original checkout. The original folder remains clean on `dev` until integration.

## Observed regression evidence

- Baseline language tests: 5 passed, 17 assertions.
- Functional RED in the complete worktree:
  `bun test tests/built-page-runtime.test.ts -t 'blocked|active theme'` exited 1,
  with 10 failures, 0 passes, and 30 filtered tests. Six failures exercise real
  compiled theme code with blocked storage; four reject invalid legal colors.
- The DOM harness does not implement CSS `@layer base`. For color assertions it
  exposes the emitted `:root`/`.dark` token declarations unchanged outside the
  layer and checks that those tokens are nonempty. This is a bounded simulation
  of the token contract, not proof of the complete browser cascade.
- The installed `chrome-launcher` detected no local Chrome installation. No
  browser was downloaded or installed; a real-browser check is not claimed.
- Focused GREEN:
  `bun test tests/built-page-runtime.test.ts tests/language-client.test.ts`
  exited 0, with 45 tests passed and 984 expectations. No expectations were
  weakened; the language fixture now exercises the active API and JSON-LD
  escaping helper. Targeted formatting and `git diff --check` also passed.
- Parent gates in the complete worktree:
  - `bun run format:check`: PASS.
  - `bun run check`: PASS, 53 files, zero errors/warnings/hints.
  - `bun run test`: PASS, 206 tests in 16 files, 1,728 expectations; includes
    a fresh production build, output verification, and compiled-page tests.
  - `git diff --check`: PASS. No lockfile or package manifest change.

The source/test changes remove approximately 313 lines overall, including the
340-line unused language module, while adding behavior regressions. The shared
legal stylesheet contains the previous spacing/typography with valid colors and
explicit selector scope. No code was compressed to satisfy a review-size budget.

## Roles and continuity

Executor: requested `gpt-6.1-sol/high`; independent reviewer: requested
`gpt-6-astra/xhigh`. Previously read role contracts and skills are reused.
The spawn interface does not load role TOMLs or enforce their read-only sandbox.
No substitutions are planned. Engram tools remain unavailable; this file stores
local task continuity. Do not infer CI or production results from local checks.
