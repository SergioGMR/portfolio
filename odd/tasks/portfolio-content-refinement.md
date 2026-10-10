# Portfolio content refinement

## Goal and authorization

Apply the follow-up SEO/GEO/AEO audit while giving employment opportunities and client projects equal weight. The user explicitly requested removing Solutec as a project, case study and link destination while retaining the Tecandu employment experience. Prior authorization to create the necessary commits remains in force.

Work only in `/Users/sergiogmr/portfolio-worktrees/seo-geo-20261010`, branch `feat/seo-geo-20261010`, starting at `6b1e625908bee85dfbced1c913d3adbab71776b2`. Preserve the original dirty checkout and the separate main integration worktree until an authorized publication step requires integration. No additional skill installation, dependency changes, credentials or paid analytics features.

## Ownership and plan

- [x] I1 — Parent: reconcile instructions, clean candidate, audit evidence and the user's removal scope.
- [x] I2-A — Executor: remove the Solutec project, routes, public project links and unused project assets; retain Tecandu chronology and responsibilities. Include meaningful regression coverage and report any CV link implications before editing PDF assets.
- [x] I2-B — Executor, after I2-A: improve bilingual hero/contact copy, concise project summaries, substantive case detail from existing factual sources, case metadata, linked capability evidence and the ambiguous practice badge. Do not invent outcomes or architectural decisions.
- [x] I2-C — Executor/parent: update measurement guidance for the resulting route inventory and current official generative AI reporting, with explicit limits for Hobby analytics.
- [x] I3 — Executor/parent/reviewer: RED/GREEN for changed behavior, existing test/check/format/build gates, browser verification of changed pages, applicable Lighthouse gate and separate read-only review.
- [x] I4 — Parent: commit coherent behavior units and verify publication against the authorized repository, Vercel project and apex domain. Publication and local checks passed; the separate, preexisting CI performance failure below remains unresolved. This is not an all-green CI delivery.
- [ ] PERF-01 — Follow-up: identify and correct the preexisting first-run CI performance failure without dropping measurements or relaxing budgets. No application or infrastructure cause is established. Provider reception, indexing and rankings also require their own observed evidence.

## Acceptance

- Solutec is absent from the public project catalog, generated cases, sitemap, metadata/schema and navigation; its removed case URLs resolve as missing pages rather than misleading redirects. Tecandu experience remains intact, without a link to Solutec.
- Home cards summarize the work and link to case pages with genuinely additional detail supported by existing profile/CV facts. No fabricated KPIs, clients, dates, technologies or decision rationale.
- Spanish and English copy identify the person, role and Laravel expertise; project and employment contact options have equal emphasis and accessible, descriptive names.
- Capability evidence links resolve to named projects or retained experience anchors in both locales. Existing fragment/language behavior remains covered.
- The unexplained numeric practice claim is replaced by a grounded, localized description.
- All remaining pages retain correct apex canonical URLs, reciprocal locales, valid schema, JPEG social metadata and an accurate sitemap. Expected inventory after removal: 12 indexable pages and a noindex 404.
- Preserve existing unrelated assets, legal content, dependency lockfile, Lighthouse budgets and original-checkout changes.
- CV employment content is retained. If its public PDFs contain the removed project's URL, inspect a proportionate annotation-only removal path and keep the employment text/layout unchanged; record the actual decision and checks before modifying them.

## Validation and commit boundaries

1. `remove Solutec project`: catalog/routes/link removal and its regression tests. Rollback restores that project and its routes without reverting subsequent content improvements.
2. `improve portfolio content and evidence`: localized content/data/templates/link behavior with relevant tests. Rollback restores the previous copy and presentation while keeping the project removal.
3. Measurement/coordination documentation follows the behavior it describes, with final receipts recorded honestly. Do not rewrite historical receipts from earlier 14-page builds.

Current implementation receipts are recorded below. Previous 160-test/Lighthouse receipts apply to the old source only. Browser and Lighthouse runs are serialized; source remains frozen during independent review.

## Environment and continuity

The codebase-memory refresh failed with `Transport closed`; focused local search is the fallback. Engram tools are absent from the exposed catalog, so no shared-memory persistence is claimed. The parent owns this document, Git mutations, integration and browser/provider work. Children do not delegate or write memory. Executor requested model: `gpt-6.1-sol/high`; reviewer: `gpt-6-astra/xhigh`. The client does not expose independent effective-model telemetry or a per-spawn read-only enforcement option.

## I2-A preparation

- The user confirmed retaining Tecandu while removing the Solutec project and its links. The experience data already allows an absent URL and the template already renders plain text in that case.
- Executor inspected both CV HTML sources and all four public PDFs with the installed `pypdf` library. They retain Tecandu but contain no Solutec text or link; PDF annotations only link to email and LinkedIn. No CV changes are needed or authorized by this finding.
- Additional I2-A paths authorized after discovery: `src/components/pages/CaseStudyPage.astro`, the unused `src/assets/experience/solutec.avif`, and `src/lib/professional-profile.test.ts`.
- Existing toolchain selected without installation: Node **24.21.0** at `/opt/homebrew/opt/node@24/bin/node`, Bun **1.4.2**. Ambient Node 26 is not used for validation.
- Parent recorded hashes of all ten known dirty files in the original checkout for final preservation comparison. The separate main checkout remains at `1b499ed5452d615f39f78c4981c411af9d745b0b`.

## I2-A implementation evidence

- Executor completion confirmed; source frozen before parent integration. Solutec was removed from project data, case IDs, both image maps and its unused AVIF. Tecandu retains all dates, responsibilities, outcomes, technology and capability associations; its optional external link was removed.
- Observed RED: **23 pass / 10 fail**. Failures cover the old eight-project/four-case inventory, lingering Solutec content/artifacts, and the Tecandu external link. The raw failure receipt printed large Happy DOM object graphs; parent compressed it losslessly as `.lighthouse/i2a-red.log.gz`. Avoid dumping DOM objects in subsequent negative assertions.
- Focused GREEN: **33 pass / 0 fail / 576 expectations**. Full suite: **161 pass / 0 fail / 965 expectations** across 15 files. `bun run build`, including the output verifier, ran from the compiled-page fixture during those checks; no redundant standalone rebuild is claimed.
- Parent inspected full-suite, Astro, format and verifier receipts: Astro **52 files / zero errors, warnings or hints**; formatting, generated-output validation and `git diff --check` pass. Logs are `.lighthouse/i2a-{green-focused,tests-full,check,format,format-check,verify-output,diff-check}.log`.
- Current generated inventory: **12 indexable pages, six case pages and seven projects**. Both removed localized case artifacts are absent from `dist` and the Vercel output; the generated fallback remains HTTP 404. This is local output proof, not a deployed HTTP check.
- Source diff before this task record: 12 files, **140 additions / 59 deletions**, plus removal of the 29,605-byte AVIF. Browser, Lighthouse and independent review remain pending for the complete refinement.
- Parent created `68ed8ce` (`refactor(portfolio): remove Solutec while retaining Tecandu experience`) after inspecting receipts and the staged diff. This includes the behavior, related tests, route-count documentation and this task's initial record. No push or deployment was performed at this checkpoint.

## I2-B/I2-C decisions

- Keep hero discovery links, and give client-project and employment contact options equal styling in the contact section. Both use the existing public portfolio email with distinct localized, encoded subjects; no external communication is sent during validation.
- Explain existing work with clearer summaries and deeper details from the profile/CV, rather than inventing architectural motivations or impact metrics. Capability links identify actual cases or the retained Tecandu experience.
- Replace the unexplained practice-year count with a localized factual specialty. Do not rewrite CV education facts without confirmation.
- Update Basuraleza's external URL to its observed final public destination, `https://proyectolibera.org/app-basuraleza-caracterizacion-residuos`, which returned HTTP 200 during the fresh audit.
- Add the currently documented Search Console generative AI impressions report to measurement guidance, without claiming access, enough impressions or a collected baseline.


## I2-B/I2-C implementation evidence

- Executor completed and its final status was confirmed before integration. The source is frozen for final visual/performance checks and independent review.
- Both locales now state the Tech Lead role, Laravel specialty and Las Palmas location. Project and employment contact links have identical styling, distinct localized encoded subjects and the existing public portfolio mailbox.
- Home cards use short summaries; the six localized case pages add context, participation, tasks, deliverables and technologies from existing project/CV facts. JauntJar retains the collaboration with the author's wife. Todo-Lux and Basuraleza reuse their canonical experience responsibilities; repeated 2020 entries were deduplicated in profile data only.
- Capabilities link to localized Todo-Lux/Basuraleza cases or the Tecandu experience anchor. The employment name remains `Tecandu S.L.`. The ambiguous year count and unsupported decorative Hexagonal label were replaced by Laravel specialty and APIs/CI/CD focus.
- Observed compiled-contract RED: **20 pass / 10 fail / 377 expectations**. Focused GREEN: **30 pass / 0 fail / 467 expectations**. Full suite: **171 pass / 0 fail / 1,069 expectations** in 15 files. Build and generated-output validation ran in the compiled-page fixture.
- Parent inspected receipts: Astro **52 files, zero errors/warnings/hints**; formatting, standalone generated-output validation and diff checks passed. Receipts: `.lighthouse/i2b-{red,green-focused,tests-full,check,format,format-check,verify-output,diff-check}.log`. Failure output now uses bounded assertions instead of dumping DOM graphs.
- The implementation unit is 13 files, **383 additions / 132 deletions = 515 authored lines**, excluding the parent's task record. Data, rendering and compiled-output coverage form one coherent contract; it was not artificially split to hide the size.
- CV sources/PDFs, dependencies, lockfile, legal content, analytics behavior and Lighthouse budgets remain unchanged. Browser, Lighthouse and final independent review are pending below.
- Read-only Vercel CLI metadata confirms project `prj_KCGw8ftCB1MADnNGZIMjmnEu6Oif` is linked to `SergioGMR/portfolio`, production branch `main`; current production SHA remains `1b499ed5452d615f39f78c4981c411af9d745b0b`. Web Analytics is enabled and reports existing data, which does not establish reception of the new implementation.


## I3 final local verification

- Content implementation committed as `2292a289f79ed62cbbe4f58323e56ebff486d7a6` (`feat(portfolio): clarify bilingual positioning and project evidence`). Independent reviewer completed **APPROVED** for `6b1e625..2292a28`, with the reviewed source clean. No unresolved code/content/regression findings remained.
- Reviewer independently inspected generated HTML and protected bytes: 12 apex canonicals, 36 language alternates, no duplicate IDs, matching `dist`/Vercel static pages, absent Solutec routes, final 404 fallback and noindex 404. Four PDFs, two CV HTML sources, package/lock, Astro configuration, Lighthouse budgets and legal content were unchanged within this refinement.
- Parent native Edge checks used the compiled output at 390 x 844 and 1440 x 900. Both locales showed seven cards, equal contact options with correct localized subjects, and no horizontal overflow. Project navigation landed below the mobile sticky header (79.625px vs header bottom 72px); the English Tecandu evidence link landed at 77.875px vs 72px and retained its fragment in the Spanish language link. Todo-Lux opened from capabilities at the correct English route, exposed seven concrete tasks, and switched to its Spanish equivalent. Desktop contact buttons measured 48px high and approximately 237.1px wide each. Screenshots were inspected in dark and light themes. The temporary server was stopped, tab closed and viewport override reset.
- Final Lighthouse on unchanged source `2292a28`: **exit 0; all five mobile-home runs score 100 performance / 100 accessibility / 100 best practices / 100 SEO**. FCP median 903.9789ms, TBT 0, CLS 0, server response 1ms. Existing WARN LCP remains **1428.9789ms vs 1200ms**, effectively unchanged from the prior 1428.78915ms measurement. Budgets were not relaxed. Receipts: `.lighthouse/i3-lighthouse.log` and `.lighthouse/run-1791659904542/`.
- Parent reread both official Google sources on 2026-10-10. The report documentation explicitly confirms worldwide rollout on August 31, 2026, impressions in AI Overviews/AI Mode and the need for sufficient impressions. This verifies the measurement guidance, not access to this property's actual report.
- All ten baseline hashes of the original checkout's dirty files still match. No source edits were made during review.

## I4 publication scope and progress

The immediately preceding audit recommended publishing the prepared improvements first; the user's subsequent instruction to apply everything except Solutec authorizes that proposed publication. This supersedes the historical pre-approval publication status in the earlier task record. Destination is the existing `git@github.com:SergioGMR/portfolio.git` repository, `main`, linked to the existing Vercel portfolio project and `https://sgmr.dev`. Use the configured Git/CLI sessions without inspecting credential files, changing provider settings or bypassing checks.

The remote `main` was fetched and remained at `1b499ed5452d615f39f78c4981c411af9d745b0b`. The clean dedicated main worktree was fast-forwarded to reviewed source `2292a28`; remote push, CI and deployment evidence are recorded next only after completion. The original dirty checkout remains untouched.


Publication checkpoint: remote main push to `2292a28` succeeded. GitHub run `38079437189` passed dependency installation/audits, formatting, type checking, tests and build, but failed the first Lighthouse performance measurement: 92, followed by four 100 scores. First-run TBT was 358.5857ms; the other four were 0. Budgets remain unchanged. One rerun of the same failed job was requested to establish reproducibility; no successful CI claim or provider deployment is made yet. Receipt: `.lighthouse/i4-ci-2292a28-failed.log`.

Vercel has not listed a deployment for that SHA. A read-only CLI dry run from the main worktree showed that ignored local caches would be included (91,163,261 bytes). That upload input was rejected before transmission; an exact tracked-source input or Git-backed deployment is required. No application deployment was created by the dry run.


- [x] I4-D — Executor/parent/reviewer: expose bounded diagnostics for the reproducible first-run CI performance failure, collect reports, and preserve all existing thresholds and measured runs. Causal resolution is tracked separately as PERF-01; no blind reruns.

Second CI attempt on unchanged `2292a28` also failed the first performance score (96; four subsequent 100 scores), with first-run TBT 210.2838ms and four zeros. This confirms the symptom is repeatable; it does not identify the cause. Receipt: `.lighthouse/i4-ci-2292a28-attempt2.log`. Independent review supports one diagnostic rerun and explicitly requires investigation if it repeats. The CI result remains FAIL until new evidence resolves it.

Vercel's normal Git integration subsequently completed production deployment `dpl_4vnRiHtjP6QgrGaPk9ADnzTMymz5`, READY, `gitSource.sha` and `meta.githubCommitSha` both exactly `2292a289f79ed62cbbe4f58323e56ebff486d7a6`, with `sgmr.dev` assigned and no alias error. No manual source upload or deployment API mutation was needed.

Public runtime receipt `.lighthouse/i4-public-runtime-2292a28.json` is PASS: all 12 indexable routes return 200 at the expected canonical apex URL, match local language/alternate contracts and omit Solutec; both removed case URLs return 404/noindex. Four www redirects and three trailing-slash redirects return 308 and preserve queries. `/sitemap.xml` contains exactly the 12 URLs. Public robots.txt, JPEG social image and both canonical PDFs match repository bytes. The official analytics script returns 200. Native Edge additionally confirmed the production hero, seven project cards, retained Tecandu, absent Solutec and actual injected `/_vercel/insights/script.js` DOM node; this does not prove dashboard reception.

Two earlier ad hoc runtime probes stopped on verification-harness assumptions, not application defects: the adapter injects analytics dynamically instead of a static script src, and this repository serves `/sitemap.xml`, not `/sitemap-index.xml`. The final receipt above uses the actual contracts. No application change was made to satisfy those incorrect assumptions.


I4-D diagnostic configuration was independently APPROVED after executor completion. The workflow adds an ID to the existing Lighthouse step and a failure-only bounded report summary: latest report directory, at most five runs, at most eleven audits and five rows each, 160-character text fields and a 30,000-character total cap. Existing commands, actions, permissions, five measured runs and budgets are unchanged. YAML parsing, Node syntax, prior-workflow equivalence, seven fixture scenarios, formatting and diff checks passed; maximum fixture output was 29,707 characters. Receipts: `.lighthouse/i4d-{verification,format-check,diff-check}.log`. The new CI execution will provide the missing diagnostic evidence; this change makes no claim to fix the performance cause.

## I4-E diagnostic evidence and next boundary

CI run `38080223786` on diagnostic commit `5a5651dd4250ebab13b8bac2245b7dbd59ece71d` again passed all earlier gates and failed Lighthouse: first performance score 89, then four 100 scores. First-run TBT was 442.4562ms and the following runs were 0. The failure-only diagnostic step succeeded. Its Chrome 154/Linux benchmark was 2225 initially and 2610.5–2651.5 subsequently. Receipts: `.lighthouse/i4-ci-5a5651d.log` and `.lighthouse/i4-ci-5a5651d-diagnostics.json`.

The report attributes large tasks to `Unattributable` and to the root page; main-thread groups include Other, style/layout and script evaluation. Read-only executor investigation confirmed that Lighthouse's simulated long-task audit discards child tasks and its main-thread breakdown scales raw work. These aggregates do not identify a responsible function or prove a browser/host defect. The reveal/theme scripts and Lighthouse runner/budgets are unchanged from the prior successful source. Language initialization has become smaller; new copy changes layout geometry. Browser/host first-navigation cost and page layout remain hypotheses, not verified causes.

- [x] I4-E — Executor: inspect initialization changes and installed Lighthouse attribution semantics; report hypotheses and missing evidence without changing source.
- [x] I4-F — Executor/parent/reviewer, after I4-E: retain the trace Lighthouse already collects and emit a bounded, sanitized failure summary with task/callframe attribution. Add meaningful fixture coverage. Preserve five measurements, their configuration, all assertions and cleanup; no warmup, dropped run, relaxed threshold or blind application edit. Parent retains Git/provider/document ownership.

Vercel deployment `dpl_9BjqzemKNxR4bYEmbQAcPRNREXof` is production READY with the exact diagnostic-only `5a5651dd4250ebab13b8bac2245b7dbd59ece71d` Git SHA, apex alias assigned and no alias error. Its application source is unchanged from the independently reviewed and publicly verified `2292a28`; CI remains FAIL.

The parent additionally checked all seven external project/code destinations exposed on the live homepage. Each returned HTTP 200 at its expected URL; receipt `.lighthouse/i4-public-project-links.json`. The original checkout's ten protected dirty-file hashes still match.

## I4-F implementation receipts

Executor source is frozen for independent review: the existing runner and its tests, the focused trace helper and its tests, and the failure-only workflow summary. Traces already gathered by Lighthouse are retained and analyzed only after all five measurements when assertions fail. No application source, measurement flags, browser launch options, number of runs, dependency or budget changes are included.

Observed RED: **37 pass / 2 fail** for missing trace retention and failure cleanup. GREEN/full suite: **192 pass / 0 fail / 1,208 expectations** in 16 files. Astro reports **54 files with zero errors, warnings or hints**. Formatting and diff checks pass. A separate Node **24.21.0** fixture executes the actual runner and installed Lighthouse processor, checks exactly five simulated measurements, failure preservation, sanitized extraction and owned-resource cleanup. Nine workflow scenarios pass with maximum output **29,814 characters**. Receipts: `.lighthouse/i4f-{red,full-test,check,format-check,node,workflow,diff-check}.log`. These are diagnostic-code tests, not a new successful real Lighthouse or CI run.

The first independent review requested two diagnostic corrections: retain CPU-profile node definitions from before navigation and retain tasks that overlap navigation start. The executor reproduced both with **18 pass / 3 fail**, then resolved profile definitions separately from sample timestamps and kept overlapping task intervals with explicit negative start times. Unknown sample timing is reported separately instead of being attributed to page work. Final focused checks: **61 pass / 0 fail / 239 expectations**; full suite: **196 pass / 0 fail / 1,232 expectations**. Node 24 reproductions, Astro (54 files, zero diagnostics), nine workflow scenarios, formatting and diff checks pass. Receipts: `.lighthouse/i4f-r1-{red,green,node,full-test,check,format-check,workflow,diff-check}.log`. The source is frozen for the second independent review; real Lighthouse and CI remain pending for this diagnostic revision.

Second independent review **APPROVED**, with both P2 findings closed and personally reproduced using Node 24. The reviewer confirmed the five-run gate, budgets, cleanup, limits and sanitization remain intact. Parent then ran real Lighthouse on the unchanged compiled application using the revised runner: **exit 0; all five runs score 100 in performance, accessibility, best practices and SEO**, TBT 0 and CLS 0. The existing LCP warning remains at **1430.2431ms** against 1200ms. Receipts: `.lighthouse/i4f-lighthouse.log` and `.lighthouse/run-1791662221750/`. This verifies local runner compatibility, not the cause of the CI failure. The reviewed diagnostic unit is five implementation/test/workflow files, 779 additions; CI trace evidence is still pending.

## I4-G final evidence and bounded closure

- [x] I4-G — Executor/reviewer/parent: inspect actual CI trace evidence and the historical baseline, classify the observed symptom accurately, and close the SEO/content scope with the remaining performance gate explicitly open.

Diagnostic commit `36a5cca3516e3c8c5686621e7913aa86d6dbca9a` was reviewed, committed and fast-forwarded to remote main. CI run `38081876110` passed installation, both dependency audits, formatting, Astro/TypeScript, tests and build. Lighthouse remained **FAIL**: performance **85/100/100/100/100**, TBT **429/0/0/0/0**. Trace extraction succeeded. The first trace contains 177.23ms Paint self time and 88.83ms Decode Image, without a resource URL or callframe identifying their origin. Its broader initial work and lower benchmark are observations, not proof of an application or host cause. Receipts: `.lighthouse/i4-ci-36a5cca.log` and `.lighthouse/i4-ci-36a5cca-diagnostics.json`.

The earlier successful baseline run `37829041438` on `1b499ed5452d615f39f78c4981c411af9d745b0b` was its second attempt. The parent fetched the original first attempt from October 8: all earlier gates passed, but Lighthouse recorded **89/100/100/100/100**, TBT **443/0/0/0/0**. Receipt: `.lighthouse/i4-baseline-1b499ed-original-attempt1.log`. Executor and independent reviewer both confirmed that the same symptom predates the SEO/content changes. This does not prove the same underlying cause or exclude changes in its magnitude. The reviewer withdrew the proposed baseline rerun because the historical evidence already answers that question; no additional rerun was requested.

Read-only asset inspection found unchanged visible logo, AVIF formats, image dimensions, fonts and initial paint styles. Shorter cards can alter which lazy images enter the loading distance; the trace does not identify a specific costly resource. No speculative image, font, UI or browser-flag change was made. PERF-01 remains open; a later isolated image-format comparison would be an experiment, not an already verified fix.

Vercel deployment `dpl_Dga1K6twSx57jq5CGMcc3LUkxWbr` is production READY with exact Git SHA `36a5cca3516e3c8c5686621e7913aa86d6dbca9a`, apex alias assigned and no alias error. Application source, public assets, dependencies and budgets are byte-identical to the application publicly verified at `2292a28`. Independent review approves closing the SEO/content implementation and publication with the explicit limitation **CI performance FAIL; preexisting symptom confirmed; cause and resolution pending**.

Final functional state: Solutec removed, Tecandu and CVs retained, equal client/employment contact options, clearer bilingual positioning and factual case detail, linked capability evidence, 12 canonical indexable pages and valid removed-page responses. Local tests/checks/build, native browser verification and five real local Lighthouse runs passed. No GSC/Bing or analytics dashboard baseline, indexing, ranking, field-performance or AI-citation result is claimed. Original dirty work is preserved. Engram remains unavailable through exposed tools; this document carries continuity without claiming memory persistence.
