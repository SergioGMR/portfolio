# SEO and GEO improvements

## Authorization and baseline

- Request: fix the findings of the SEO/GEO audit and improve the portfolio.
- Authorized: local implementation, regression tests, builds, browser checks and independent review. Follow-up explicitly authorizes all necessary local commits and a new review after those commits.
- User correction: the primary domain is **`https://sgmr.dev` without www**. This supersedes the earlier inference from the observed public redirect. Apply apex consistently and redirect www to apex in repository configuration.
- No pushes, deployment, provider configuration, paid services, dependency changes or credential access are authorized.
- Working directory: `/Users/sergiogmr/portfolio-worktrees/seo-geo-20261010`.
- Branch: `feat/seo-geo-20261010`; base: `1b499ed5452d615f39f78c4981c411af9d745b0b`.
- Original dirty checkout: `/Volumes/Develop/Astro/portfolio`, HEAD `5ce09c867b9abaa6b51ee98c1d4bed16eadd2132`; preserve all existing changes.
- Clean source worktree: `/Users/sergiogmr/portfolio-worktrees/main-integration-20261004`; preserve it.
- Dependencies copied locally with APFS cloning from the clean source worktree. No installation or lockfile change.
- Runtime: Node `24.21.0`, Bun `1.4.2`. The actual test runner is `bun test`.
- Engram tools unavailable in this runtime; this file carries local continuity.

## Ownership and constraints

The parent owns architecture, integration, this document and shared memory. Research and review are read-only by contract; the client does not expose a per-agent read-only sandbox. One executor owns application/test/config/assets writes. No shared-file writes during review. Preserve blue/glass styling, both languages, themes, reduced motion, existing projects, factual career content and legal text. Never invent clients, metrics, responsibilities, services, availability or SEO results.

## Live TODO

- [x] C1 — Investigator + executor: mapped and corrected canonical-domain contracts to `https://sgmr.dev`, with RED → GREEN evidence and full gates passing.
- [x] C2 — Parent, after C1: validated prepared commit snapshots and created three cohesive local work-unit commits with tests and measurement documentation.
- [x] C3 — Fresh independent reviewer, after C2: complete committed range reviewed; two newly found fragment/accessibility defects corrected in separate commits, validated and independently re-reviewed with APPROVED outcomes.

Previous implementation phase:

- [x] M1 — Parent + investigator: reconciled clean base, source map, language and analytics dependencies.
- [x] M2 — Executor, after M1: implement cohesive units with observed RED → GREEN → REFACTOR; source frozen and executor completion confirmed.
- [x] M3 — Executor + parent, after M2: final automated gates and ES/EN desktop/mobile browser checks completed; LCP warning explicitly retained.
- [x] M4 — Independent reviewer: three findings corrected with regression coverage; final source and artifacts independently APPROVED; agent completion confirmed.

## Planned behavior units

1. **Canonical URLs and languages:** use the user-confirmed primary host `https://sgmr.dev`; root Spanish and `/en` English; canonical URLs without trailing slash except `/`; stable translated legal/project routes; URL-authoritative locale; crawlable language links, per-page canonicals, reciprocal alternates and complete sitemap. Preserve existing Spanish routes. Represent the www-to-apex permanent redirect in local hosting configuration where supported; runtime/domain-dashboard behavior remains unverified until deployment.
2. **Metadata and crawl policy:** consistent Person identity and page-specific WebPage/ProfilePage metadata; 404 noindex with no fake alternates; distinguish search crawlers from training crawlers, preserving existing training opt-outs. No special GEO files or fabricated schema data.
3. **Project evidence and conversion:** dedicated bilingual case studies derived exclusively from existing factual project data, internal links and clear contact/CV actions; preserve existing external demos. Improve image descriptions and meaningful UI semantics where relevant.
4. **Social assets and measurement:** use a broadly compatible social card derived from the existing image, with correct dimensions/MIME. Verify the existing analytics integration, add bounded non-PII conversion instrumentation only if supported without installing dependencies or activating paid provider features. Document provider-only steps and measurement baseline requirements honestly.

## Resolved implementation details

- Existing `main` disables Vercel Web Analytics; the older checkout's enabled flag is not authoritative. No analytics SDK is installed. The user confirmed **Hobby / free**. Executor inspection of installed `@astrojs/vercel@11.0.11` confirms `webAnalytics.enabled` can inject the official same-origin `/_vercel/insights/script.js` without an SDK. Enable only when `VERCEL_ENV === 'production'`; no custom events, paid plan activation, synthetic pageviews or undocumented event APIs. Provider enablement and data reception remain unverified.
- Four existing public case-study records (JauntJar, Todo-Lux, Basuraleza, Solutec) already have bilingual problem/responsibility/solution/result fields. Reuse only that public content, existing technologies and genuine images on dedicated detail pages; do not inspect private applications.
- Spanish detail routes: `/proyectos/<slug>`; English: `/en/projects/<slug>`. Existing other four projects retain direct demo access. Home, legal and detail pages have genuine equivalent language routes.
- Set Astro `trailingSlash: 'never'` and compatible Vercel normalization; verify generated routing rules against the actual adapter output.
- Roles requested through the client: investigator `/root/seo_code_research` with `gpt-6-luna/high`; executor `/root/seo_implementation` with `gpt-6.1-sol/high`; independent reviewer `/root/seo_evidence_review` with `gpt-6-astra/xhigh`. The parent owns orchestration and integration. No substitutions were made. The client accepts explicit model/effort selections but does not expose independent effective-model telemetry or a per-agent read-only sandbox.

## Reference evidence

- Google canonical URLs: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Google multilingual pages: <https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites>
- Google AI features: <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>
- OpenAI crawler separation: <https://developers.openai.com/api/docs/bots>
- Claude crawler separation: <https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler>
- Vercel Web Analytics custom events require Pro/Enterprise: <https://vercel.com/docs/analytics/custom-events>
- Fresh UI review rules: <https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md>

## Acceptance

- Spanish and English each have independently retrievable initial HTML; stored preferences never silently rewrite an explicit locale URL.
- Every indexable page has exactly one relevant title, description, canonical and H1; canonical URLs and sitemap URLs agree and resolve locally.
- Language alternates reference genuine equivalent pages and are reciprocal. Unknown routes return an actual 404.
- Existing legal content, CV links, theme behavior and all eight projects remain available.
- Case studies include factual role/problem/approach/outcome content; no unsupported success metrics.
- JSON-LD parses, matches visible content and uses a stable author identity.
- Search/training bot rules are tested independently. No assumption that allowed crawling guarantees indexing/citation.
- Hobby measurement uses ordinary pageviews/referrers only; no custom events, synthetic click pageviews or conversion claims. Provider acceptance is not inferred from local script presence.
- Existing test and Lighthouse expectations are not weakened to get green.
- Build output validation covers the expanded routes, metadata, links and missing-page behavior.
- Independent review completed after source writes stop; original checkout/source worktree preserved.

## Validation ledger

Baseline observed by executor: `bun test` — **117 pass, 0 fail, 603 expectations**.

Implementation milestones (historical TDD evidence):

- Unit A: 5 observed RED failures for locale/sitemap/bots and 2 for schema; focused GREEN **9 pass, 68 expectations** across site/language-client/page-metadata tests.
- Unit B: observed RED for case-study internal links and JPEG card; focused GREEN **19 pass, 132 expectations**. Derived social image is **1200 × 630 JPEG**.
- The generated-output validator and fixtures are being extended before full gates and independent review. Focused results do not establish full-suite/build/browser success.
- Initial compilation emitted **15 HTML pages (14 indexable + 404)**. Its first verification failed against old validator expectations, still being updated; this is not a passing build gate yet.
- Generated `.vercel/output/config.json` includes **308 slash normalization** and a **404 fallback status**. The adapter does not copy project `vercel.json` host redirects/headers into this file. Verify the two configuration contracts separately; do not introduce a custom build-output rewriting integration. Vercel merge/dashboard precedence is a production-only check.
- Intermediate Astro check: **49 files, 0 errors, 0 warnings, 0 hints**.
- Extended generated-output gate: **40 focused tests pass** after observed RED cases for duplicate H1, false alternates, missing internal pages and missing fragments. Executor confirms prior PDF/inert-HTML/head/XML escaping regressions remain covered. Validator passes against real output of 14 indexable pages plus 404; full final build command still pending at this milestone.

Final executor gate results reported (source frozen; completion confirmed):

- `bun test`: **138 pass, 0 fail, 583 expectations**. Old same-URL locale behavior tests were adapted to the intentionally changed URL contract; independent review must verify remaining regression coverage.
- `bun run check`: **49 files, 0 errors, 0 warnings, 0 hints**.
- `bun run format:check` and `git diff --check`: **PASS**.
- Local build plus generated-output verifier: **PASS**, 14 indexable pages plus 404.
- `VERCEL_ENV=production` build: **PASS**; official analytics script appears exactly once on each of 14 indexable routes.
- Rebuilt local output: **PASS**; analytics script appears zero times on all 14 routes.
- Analytics build receipts: `.lighthouse/analytics-production-build.json` and `.lighthouse/analytics-local-build.json`.

- First Lighthouse attempt: `ChromeNotInstalledError ERR_LAUNCHER_NOT_INSTALLED`; no measurements were produced.
- Retried using the already installed Edge **155.0.4283.45**, explicit `CHROME_PATH`, an isolated temporary profile and unchanged budgets. All **five mobile measurements of the Spanish homepage** scored **100 performance / 100 accessibility / 100 best practices / 100 SEO**. Assertions pass; the existing warning remains: median LCP **1429.0434 ms** exceeds the **1200 ms warning** threshold. FCP **904.0434 ms**, TBT **0**, CLS **0**. This is local Chromium/Edge laboratory evidence, not Chrome, all-route Lighthouse or field data.
- Parent inspected `.lighthouse/run-1791650623309/assertions.json`; all error assertions pass and LCP warning remains visible.

Parent browser checks against the built output in Edge:

- Desktop 1440 × 900 Spanish home and English home: visible translated content, canonical/HTML language, one H1 and current language link verified.
- Mobile 390 × 844: home, JauntJar detail and both English legal templates have no horizontal overflow; case-to-home navigation resolves to the projects section; translated case links preserve the corresponding project.
- Light theme survives reload; keyboard Tab reaches the skip link and Enter moves focus to `main-content`.
- 404 document visibly renders its error message and has `noindex, follow`, no canonical. The test server returns HTTP 404 for unknown paths but an empty body; document presentation was checked at `/404.html`. Actual hosting fallback remains separately verified in generated configuration, not in a Vercel runtime.
- Local HTTP sweep: all 14 sitemap pages return 200 HTML, the JPEG returns 200 image/jpeg, both CVs return 200 application/pdf, and an unknown route returns 404.
- Reproduced bug: `/#proyectos` → English navigates to `/en` and loses the fragment. Browser source was then frozen and the local server stopped before corrections.

Independent review round 1: **CHANGES_REQUESTED**. Actual diff and untracked new files inspected; all four legal bodies match HEAD after whitespace normalization and prior PDF/head/inert-HTML/XML regression coverage remains. Findings:

1. **P2**: `LanguageService` is disconnected from `PageShell`; reconnect runtime enhancement and cover integration so the section hash survives locale changes.
2. **P3**: localize desktop and mobile theme accessible labels for URL locale; this defect predates the change.
3. **P3**: add `BreadcrumbList` consistent with the visible case-study breadcrumb, without implying it guarantees ranking.

Separate read-only LCP investigation: the H1 is the measured element; report breakdown and source do not demonstrate a cause or regression. Font and animation audits identify no savings. No speculative optimization or budget relaxation is justified by this evidence; keep the warning explicit. A comparable baseline measurement was not run.

Preservation check during review corrections: all **10 recorded original dirty-file hashes** match the starting snapshot; the separate `main-integration-20261004` worktree remains clean on `main`; feature `package.json` and `bun.lock` have no diff. Parent visually inspected the derived 1200 × 630 JPEG: existing SergioGMR branding is preserved without clipping. This verifies the local asset, not third-party social-card rendering.

At the first-review checkpoint, corrections and final rechecks were still pending. They are completed in the evidence below; production runtime remains unverified.

Review correction RED observed by executor: the new `tests/built-page-runtime.test.ts` builds actual pages and exercises emitted JS modules against the DOM; Spanish/English hash links and theme labels fail, and breadcrumb metadata is missing. Focused result before correction: **4 pass, 5 fail, 33 expectations**, without import failures. The disconnected initializer is now covered beyond its isolated unit test.

Review correction focused GREEN: **11 pass, 0 fail, 106 expectations**. Built-module tests cover initial fragments and `hashchange` in ES/EN despite opposite stored locale, unchanged metadata, equivalent case/legal routes, exact localized theme labels/options with desktop/mobile actions, and matching breadcrumb data across eight case routes. `LanguageService` was restored to `PageShell`. These are DOM simulation tests using actual emitted modules, separate from native-browser proof.

Correction full gates reported before final Lighthouse: **147 pass, 0 fail, 667 expectations**; Astro check **50 files, 0 errors/warnings/hints**; format check passes. Production build and output verification pass; all 14 indexable routes include exactly one official analytics script (`.lighthouse/analytics-production-build-m4.json`). Application source is frozen. Parent browser work is paused until Lighthouse finishes to avoid concurrent browser load affecting measurements.

## Previous local acceptance before the domain correction

- Executor completed all final gates: **147 tests / 667 expectations**, Astro check **50 files / 0 errors / 0 warnings / 0 hints**, formatting, build/output verification and diff check. No dependency, lockfile or Lighthouse budget/runner changes.
- Parent inspected final `.lighthouse/run-1791651397395/assertions.json`: **all five mobile Spanish-home runs score 100 in all four categories**; all error assertions pass. The **LCP warning remains at 1431.8871 ms versus 1200 ms**. Median FCP is **906.8871 ms**, server response **2 ms**, TBT **0**, CLS **0**. This is a local Edge 155 lab result only.
- Parent inspected final analytics receipts: `.lighthouse/analytics-production-build-m4.json` has **14 × 1** official integrations; `.lighthouse/analytics-local-build-m4.json` has **14 × 0**. No actual provider collection was tested.
- Native browser recheck, desktop 1440 × 900: `/#proyectos` → English reaches `/en#proyectos`; navigating to Contact and switching to Spanish reaches `/#contacto`. URL fragments now survive both initial page navigation and subsequent section changes.
- Native browser recheck, mobile 390 × 844: corresponding JauntJar ES/EN routes work; Spanish theme options are **Claro / Oscuro / Sistema** with **Seleccionar tema**; English options are **Light / Dark / System** with **Select theme**. Desktop English buttons use **Switch theme to Light/Dark/System**. No horizontal overflow was observed.
- Light theme persisted across reload. Keyboard Tab reached **Skip to content** and Enter focused `main-content`. Rendered case breadcrumbs and JSON-LD agree. Reduced-motion behavior was not separately emulated in the native browser; unchanged stylesheet behavior and automated coverage are not a substitute for such a check.
- Independent reviewer **APPROVED** the final actual source/diff/new test and built artifacts. It verified all three findings resolved and found no weakened coverage. The reviewer did not rerun the suite/build/browser; executor gates and parent browser evidence remain separately identified.
- Parent final `git diff --check` passes. Original dirty checkout status is unchanged and its ten recorded file hashes match; the separate main worktree remains clean. Feature work is uncommitted on `feat/seo-geo-20261010`, based on `1b499ed5452d615f39f78c4981c411af9d745b0b`.
- Temporary local servers were stopped, test tab closed and viewport override reset. All delegated agents completed. Engram tools remain unavailable, so continuity is stored in this task document; no persistent-memory write is claimed.

Implementation surfaces: `src/lib/site.ts`, `page-metadata.ts`, `language-client.ts`; SEO/language/theme/layout components; shared home/legal/case templates and new ES/EN routes; `public/robots.txt` and `public/og.jpg`; Astro/Vercel configuration; generated-output verifier and regression tests. Measurement instructions are in `docs/seo-measurement.md`.

Remaining work is publication/provider validation, plus optional investigation of the explicit LCP warning. There is no claim of CI, deployed SHA, indexing, rankings, AI citations, provider analytics reception or real social previews.

Production-only: provider domain redirect precedence, Search Console/Bing verification and indexing reports, CrUX field data, analytics/event reception and social-network preview caches. No access or success claimed.

## Publication follow-up (not authorized or executed)

After local validation and review, publication needs its own explicit authorization. The reviewable target is this feature branch, based on the recorded clean source; do not publish the older dirty checkout.

1. Align the Vercel project's primary domain with the user's explicit choice, `sgmr.dev`. The previous audit observed apex redirecting to www; an opposite dashboard redirect must be removed or aligned before deploying a www-to-apex repository rule. Verify effective HTTP status and `Location`, including a nested route and query string. No dashboard change is authorized in this task.
2. Confirm Web Analytics is enabled for this existing Hobby project, then verify actual pageviews/referrers after a production deployment. No plan upgrade or custom-event collection is part of this change.
3. Use an already verified Search Console/Bing property if available. Ownership verification cannot be fabricated; any required token or DNS operation needs actual provider input and authorization.
4. Submit the deployed sitemap and inspect Spanish, English and a case-study URL for selected canonical, language content and indexing eligibility. Submission is not evidence of indexing.
5. Check real LinkedIn/X previews against the deployed JPEG; cache refresh and rendering on each platform are separate from a successful image HTTP response.
6. Establish a baseline by page, language, branded/non-branded query and referrer. With Hobby pageviews alone, do not report contact clicks, CV downloads or conversions as measured outcomes.

## Review boundaries and rollback

Each behavior unit includes its tests and validation evidence. Local commits are now explicitly requested; the parent owns Git mutations. Rollback is limited to these new commits in the isolated feature worktree; original user changes and the clean source worktree are outside the write scope. The final reviewer must inspect the committed diff after C2, not rely solely on earlier uncommitted approval.

## Follow-up evidence

- Revalidated branch and base: `feat/seo-geo-20261010` at `1b499ed5452d615f39f78c4981c411af9d745b0b`, with the previous implementation still uncommitted and no unrelated new changes in the feature worktree.
- Original dirty checkout status is unchanged; the separate main integration worktree is clean.
- Codebase-memory refresh failed with `Transport closed`; use focused `rg`/Git/local reads as fallback. Engram tools are still not exposed, so this document remains the continuity record.
- Canonical selection is a product requirement, not something to infer from a possibly misconfigured public redirect. The confirmed apex must be asserted independently of the shared site constant in regression coverage.

Commit plan after one dependency-based slicing pass:

1. **Crawler policy:** `public/robots.txt` with independent crawler-policy regression tests; permit search/retrieval agents, retain training opt-outs and advertise the apex sitemap. Reverting this unit affects only crawler policy.
2. **Production pageviews:** the production-only Analytics hunk in `astro.config.ts` with an independent guard test. Keep the separate trailing-slash change for the page-routing unit. Reverting this unit disables the integration without changing routes.
3. **Localized SEO pages:** coupled route map, shared templates, home/legal/case pages, metadata/schema, language/theme client, social image, output verifier and their tests/docs. The common route and validator contracts make this a coherent unit larger than 400 authored lines; no code or coverage will be compressed or deleted to force a line budget. Splitting base routes from cases would require reconstructing and verifying artificial intermediate versions, so this bounded task retains them together and reports the actual size.
4. **Review corrections/closure:** any newly discovered defect gets its own behavior-and-test correction commit, followed by proportional independent re-review. A final documentation-only record may capture the reviewed commit identities without claiming its own future hash.

The executor may extract existing crawler and analytics tests into independent files without weakening expectations. The parent owns explicit path/hunk staging and commits. No broad staging of the original dirty checkout, no history rewrite and no remote publication.

C1 TDD evidence: before changing implementation, **17 pass / 9 fail / 127 expectations** across 26 focused tests exposed the wrong literal origin, rendered canonical, identity/schema, robots and redirect direction (`.lighthouse/c1-red-behavior.log`). Focused GREEN then passed **72 tests / 442 expectations** across seven files, including a real build. The output gate checks the independently specified apex and rejects a www canonical even when the fixture's own configuration also claims www. Full final gates are still running at this checkpoint.

C1 final gates: **149 tests / 0 failures / 842 expectations**; Astro check **52 files, zero errors/warnings/hints**; format, build/output verification and diff check pass. Parent inspected the logs and `.lighthouse/c1-origin-sweep.json`: all 14 generated routes and adapter copies use apex canonical/social/schema/identity URLs, sitemap has 14 apex URLs, robots copies use apex and the repository redirect is exclusively www-to-apex. Local analytics remains absent. The production analytics and five-run Lighthouse receipts from M4 are inherited evidence, not fresh post-correction measurements; no UI/runtime code or analytics guard changed in C1.

Actual slicing size reported by executor: crawler unit **76 authored lines**, analytics unit **14 authored lines**, coupled localized SEO unit **3895 authored lines plus the JPEG**, excluding this parent coordination record. The larger unit and its rationale are explicit; no tests, comments or formatting were removed to meet a numeric budget.

C2 committed implementation:

| Commit                                     | Unit                                                           | Observed validation                                                                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3c2235649275b9fad0c0a8ea08970ae7ff619a4f` | Search/retrieval crawler policy with training opt-outs         | Index snapshot with locally cloned dependencies: `bun test`, **118 pass / 620 expectations**. This proves the first commit independently of uncommitted route work.                                                                       |
| `75e9a1602564e887705ae20ebe1e59a51820ef98` | Production-only Vercel Analytics                               | Index snapshot: `bun test`, **119 pass / 621 expectations**; `VERCEL_ENV=production bun run build` and verifier pass. The snapshot's four HTML pages each include one official script. The trailing-slash hunk was deliberately excluded. |
| `e66566ca5c7a0bdf6c2ab110e8986cecd5c504fc` | Bilingual SEO pages, case studies and apex canonical contracts | Exact staged source matched the C1-tested working source: **149 pass / 842 expectations**, check/build/format/output sweep pass; staged diff check passes. **40 files, 2525 additions / 1370 deletions plus JPEG**.                       |

All staging used explicit paths or an observed config hunk. No hooks were bypassed, no history was rewritten and no push occurred. Before post-commit review, tracked source is clean; only this parent-owned coordination record remains untracked and is excluded from the source review until final closure. It will be committed after recording the review result.

C3 review started in a fresh thread `/root/seo_post_commit_review`, explicitly selected `gpt-6-astra/xhigh`, against the complete committed range `1b499ed5452d615f39f78c4981c411af9d745b0b..e66566ca5c7a0bdf6c2ab110e8986cecd5c504fc`. It must inspect the complete implementation and seek additional defects beyond the already corrected host. Source remains frozen; only this coordination record can change while that source is reviewed.

Fresh public GET evidence during C3: `https://sgmr.dev/` returns **HTTP/2 307** with `Location: https://www.sgmr.dev/`; `https://www.sgmr.dev/` returns **HTTP/2 200**. The web-reader tool could not access either URL, but unauthenticated curl GETs succeeded and exposed those response headers. This confirms a current production mismatch with the user's intended primary domain. It does not establish which provider setting causes it. Align the effective production redirect before deploying the repository's opposite www-to-apex rule; otherwise a loop is possible. No dashboard or production configuration was accessed or changed.

C3 fresh review result: **CHANGES_REQUESTED**, reviewer completion confirmed. The reviewer independently inspected the entire committed range and all 14 generated routes, reciprocal alternates, links, structured data, 404, crawler policy and PDF preservation. No other blocking findings were reported. It inspected the existing receipts rather than claiming to rerun the full suite, build or Lighthouse.

- **P2 — shared fragments lost on non-home pages:** `initializeLanguage` only retained the current fragment on `/` and `/en`; switching language on legal/case pages dropped the valid shared `#main-content` fragment. Existing built-runtime tests incorrectly expected that loss. The reviewer reproduced the defect on four ES/EN routes using emitted modules in Happy DOM, which is DOM simulation rather than native-browser evidence.
- Accepted contract: preserve both the equivalent localized route and valid shared fragments, including changes after `hashchange`, on all relevant templates. Update regression expectations and observe RED before the implementation fix. The executor owns only the language client and directly related tests; the parent owns the corrective commit and later native-browser checks. Source review is complete before allowing these writes.
- After compaction, Engram tool discovery still returns no memory tools; no persistence call or successful memory write is claimed.

C3 correction RED observed before source changes: **11 pass / 13 fail / 279 expectations** in 24 tests across the built-runtime and language-client suites (`.lighthouse/c3-red.log`). Twelve failures reproduce fragment loss on all legal/case routes in both locales after confirming the anchor exists in the built HTML; the unit failure exposes missing `hashchange` synchronization. This strengthens the previously incorrect expectation rather than relaxing it.

C3 correction gates, inspected by the parent after executor completion: focused GREEN **24 pass / 402 expectations**; full suite **160 pass / 0 fail / 985 expectations** across 15 files; Astro check **52 files, zero errors/warnings/hints**; formatting, build/output validation and staged diff check pass. Receipts: `.lighthouse/c3-{green,full-suite,check,format,build}.log`. The implementation removes the home-only condition while retaining each existing equivalent route and the existing listener cleanup. Tests exercise initial fragments, `hashchange`, fragment clearing, metadata, stored locale and cleanup.

The parent explicitly staged the language client and its two regression test files and created corrective commit `ad12a98b6e401e55673c52a08a0f657c8ccaa0c8` (`fix(i18n): preserve shared fragments across translated pages`): **3 files, 72 additions / 16 deletions**. This source was frozen for browser checks and re-review; only this coordination record remained uncommitted.

Five-run Lighthouse on `ad12a98` completed successfully with Edge and unchanged budgets: all five mobile Spanish-home runs scored **100 in all four required categories**. The warning remains: median LCP **1428.79665 ms > 1200 ms**; FCP **903.79665 ms**, server response **1 ms**, TBT **0**, CLS **0**. Parent and reviewer inspected `.lighthouse/run-1791655882584/assertions.json`; no browser interactions ran concurrently with measurement.

C3-R2 independent source re-review: **APPROVED**, completion confirmed. The reviewer executed emitted modules for all 14 pages in DOM simulation and verified initial hashes, changes, clearing, route, metadata, storage and listener cleanup. It found no new related source defects and no weakened coverage. Native browser validation and this coordination record were excluded from that verdict.

Parent native Edge checks on `ad12a98`: at 1440 × 900, JauntJar ES → EN → ES preserved `#main-content`, locale and the apex canonical. At 390 × 844, activating the legal page skip link updated the fragment and focused `main-content`; language switching ES → EN → ES preserved the equivalent legal route and fragment, with correct canonical/language and no horizontal overflow.

New visual observation during those checks: after the legal skip-link/locale sequence, the sticky header spans viewport y=8..72 while H1 starts at y=57; the screenshot shows the title partially underneath the header. `main` is aligned to y=0, with `scroll-margin-top: 0px` and scrollY=64. C3-R3 focused independent review confirms a **P2 anchor-spacing defect**: the main fragment reserves no space for the sticky header, and there is no global scroll padding. This predates the hash-preservation fix. The earlier source approval does not close this newly observed browser defect.

The reviewer completed before CSS writes were authorized. The executor is applying a bounded CSS correction, preserving ordinary layout and reduced-motion behavior. Native geometry/screenshot is the observed RED; a substring test mirroring the CSS would not establish rendered positioning. Final acceptance requires native GREEN at mobile and desktop sizes, plus the existing automated gates and independent review. The parent's temporary static server was stopped before this correction.

CSS correction committed as `67331c980a6f7cc0fba172665d88229f3f9b1c99` (`fix(a11y): keep anchor targets below the sticky header`): **7 additions in `src/styles/globals.css` only**. It sets document scroll padding to 5rem on mobile and 6rem from the actual 40rem `sm` breakpoint. No existing anchor scroll margins were present, so there is no duplicated compensation; ordinary layout and reduced-motion rules remain unchanged.

CSS correction gates inspected by the parent: **160 tests / 985 expectations**, Astro **52 files / zero diagnostics**, formatting, build/output verification and diff checks all pass. The emitted stylesheet was parsed with the installed PostCSS dependency to confirm the two padding values and preserved reduced-motion rule; parsing is not proof of rendered geometry. Receipts: `.lighthouse/c3-anchor-{full-suite,check,format,build,css-output}.log`. Native GREEN and independent C3-R4 review remain in progress, with source frozen.

Final Lighthouse on `67331c9`: the command exited 0 and all five mobile Spanish-home measurements score **100 performance / 100 accessibility / 100 best practices / 100 SEO**. Parent inspected `.lighthouse/run-1791656224162/assertions.json`: all error assertions pass; the unchanged LCP warning remains at **1428.78915 ms versus 1200 ms**. FCP is **903.78915 ms**, server response **1 ms**, TBT **0**, CLS **0**. Browser interaction began only after the measurements completed.

Native GREEN on the final compiled source, verified by the parent in Edge:

| Viewport and flow                                     | Observed result                                                                                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 390 × 844, AceZone skip link with Enter, ES → EN → ES | Focus reaches `main-content`; URL keeps the fragment and correct locale; H1 top **121px**, below header bottom **72px**. The screenshot shows the complete title. Scroll padding is **80px**. |
| 390 × 844, JauntJar ES → EN with `#main-content`      | Correct equivalent route and fragment; H1 top **189px**, below header bottom **72px**.                                                                                                        |
| 1440 × 900, Wattly skip link with Enter, EN → ES      | Focus reaches `main-content`; URL keeps the fragment; H1 top **145px**, below header bottom **80px**. Scroll padding is **96px**.                                                             |
| 1440 × 900, Solutec EN → ES with `#main-content`      | Correct equivalent route and fragment; H1 top **225px**, below header bottom **80px**.                                                                                                        |
| 1440 × 900, home `/#proyectos` → `/en#proyectos`      | Correct English locale and apex canonical; after scrolling settles, the projects section starts at **95.8125px**, below header bottom **80px**.                                               |

No horizontal overflow was observed in the tested views. Canonical URLs stay on `https://sgmr.dev` and never include the fragment. Reduced motion was not separately emulated in the native browser; source and parsed CSS preserve the existing `scroll-behavior: auto` rule. The temporary server was stopped, the test tab closed and the viewport override reset after verification.

## Final local acceptance

- Reviewed application source: `67331c980a6f7cc0fba172665d88229f3f9b1c99` on `feat/seo-geo-20261010`. C3-R4 is **APPROVED**, and reviewer completion is confirmed. The complete earlier range and both subsequent fixes were independently reviewed; no unresolved source findings remain from those reviews.
- Five local application commits are recorded above. The final documentation-only closure records their evidence separately; it changes no application behavior, dependency or configuration. No commit, push, merge or deployment was made in either protected worktree, and no feature push or deployment was performed.
- Final gates: **160 passing tests / 985 expectations**, Astro **52 files / zero diagnostics**, format and build/output verification pass. Native mobile/desktop checks pass. Lighthouse is **100 in all four required categories across five mobile homepage runs**, with the explicit **LCP 1428.78915 ms > 1200 ms warning** retained.
- Final preservation check: all **10 recorded dirty-file hashes** still match in `/Volumes/Develop/Astro/portfolio`; its Git status is unchanged. The separate main worktree remains clean. Dependencies, lockfile, Lighthouse runner/tests and thresholds have no changes from the recorded base.
- Roles were explicitly requested through the client as investigator `gpt-6-luna/high`, executor `gpt-6.1-sol/high`, and reviewer `gpt-6-astra/xhigh`; no substitutions. Requested roles are distinguished from independent execution telemetry, which the client does not expose. The parent handled orchestration, commits and native browser verification.
- Engram remains unavailable in the exposed tool catalog; this committed document is the local continuity record. No persistent-memory write is claimed.
- Publication prerequisite remains: production currently redirects apex to www with HTTP 307, contrary to the confirmed apex primary domain. Align that effective redirect before deploying the local www-to-apex rule. Provider settings, deployed SHA, analytics reception, search indexing and AI citations remain **NOT_RUN / unverified**. This task does not publish the change or claim search-performance outcomes.
