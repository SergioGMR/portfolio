# SEO and GEO measurement

## Baseline and comparison

No ranking, traffic, contact conversion or AI citation baseline has been collected from a provider in this change. Establish the baseline before comparing outcomes; local HTML, test and Lighthouse results are implementation evidence only.

After an authorized production release, record the deployed SHA and release date, and export a comparable 28-day baseline from Google Search Console and Bing Webmaster Tools. Compare subsequent 28-day windows and annotate releases. Small samples and seasonal demand can make percentage changes misleading.

| Evidence                                                                 | Segmentation                                                                                   | Measure                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Google Search Console / Bing search performance                          | Brand queries (Sergio Morales Rodríguez, SergioGMR, sgmr.dev) and non-brand queries separately | Impressions, clicks, CTR and average position                     |
| Search performance by landing page                                       | Spanish `/` and `/proyectos/*`; English `/en` and `/en/projects/*`; legal pages separately     | Search visibility and clicks per language and case study          |
| Search Console Generative AI performance (when sufficient data exists)   | Canonical pages, country, device and comparable date windows                                   | Impressions in Google Search AI Overviews and AI Mode             |
| Indexing reports and URL inspection                                      | All 12 sitemap URLs                                                                            | Selected canonical, indexing status and crawl errors              |
| Vercel Web Analytics                                                     | Home, cases and language paths; available referrers                                            | Pageviews, visitors and acquisition sources                       |
| Search Console Core Web Vitals / CrUX when sufficient public data exists | Mobile and desktop separately                                                                  | Field LCP, INP and CLS                                            |
| Repeatable manual search observations                                    | Record query, date, engine, locale and cited page                                              | Observed references, without claiming comprehensive AI visibility |

URL language is a landing-page segment, not proof of the visitor's preferred language. Search Console average position is an aggregate; it is not a guaranteed rank for an individual query. Referrers can be absent or suppressed, so analytics cannot fully attribute all AI or organic discovery.

[Google's Generative AI performance report](https://support.google.com/webmasters/answer/16984139), rolled out worldwide on August 31, 2026, reports impressions for links in AI Overviews and AI Mode. The report may be absent when the site has insufficient generative AI impressions. After authorized property access, export comparable periods and segment by canonical page, country and device. Missing or preliminary data is not proof of zero visibility; this change has not collected a baseline or observed the site's report. These impressions do not measure clicks, leads or visibility across other AI providers.

[Google's optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) emphasizes original, useful content grounded in first-hand experience alongside ordinary SEO. It does not require a special AI schema or an `llms.txt` file. The portfolio presents documented contributions and deliverables; local content and link checks do not establish retrieval, indexing or citations.

## Vercel Hobby

The user confirmed Hobby. This implementation measures ordinary visits and available referrers only. It sends no custom events, contact addresses, free text, custom properties or synthetic pageviews for CV/contact clicks. A contact-link click is not a confirmed message or lead. CV downloads and external-project clicks remain unmeasured conversion actions.

`astro.config.ts` enables the existing adapter's Web Analytics integration only when `VERCEL_ENV === 'production'`. Local development, ordinary local builds and Vercel preview builds do not inject it. The installed `@astrojs/vercel@11.0.11` directly injects the official `/_vercel/insights/script.js`; no analytics SDK dependency was added. Verify this behavior again when updating the adapter: [Astro's adapter documentation](https://docs.astro.build/en/guides/integrations-guide/vercel/#webanalytics) distinguishes the legacy configuration from newer SDK component integrations.

[The Vercel plan documentation](https://vercel.com/docs/analytics/limits-and-pricing) lists the Hobby allowance, reporting window and lack of custom events. Check the current dashboard and current limits before interpreting missing data. No paid feature, plan upgrade or dashboard activation was performed here.

Provider steps require explicit authorization: enable Web Analytics for the correct project if it is not already enabled, deploy the reviewed change, and verify that a production page loads the official script and that an ordinary visit appears in that project's dashboard. Script presence in a local build does not prove successful collection. Browser blockers can suppress collection.

## Canonical and crawler follow-up

The canonical host is `https://sgmr.dev`; paths have no trailing slash except `/`. Spanish routes remain available, with real English equivalents. The sitemap includes two homes, four legal pages and six case-study pages. The generated adapter routing config is checked for a 308 slash redirect and a real 404 fallback. `vercel.json` separately declares a permanent www-to-apex redirect preserving the path and existing query strings, with no redirect on the apex host.

The earlier production audit observed an apex-to-www HTTP 307 redirect. On 2026-10-10, the user authorized aligning the provider settings through the Vercel CLI: apex now serves production directly, and www redirects to apex with HTTP 308. Public checks confirmed root and both existing legal routes, including query preservation and one-hop completion. The production deployment ID was unchanged; this did not publish the local application changes.

After release, verify apex/www and slash variants for home, legal and case-study routes, preserving paths and query strings. Check the effective redirect status and final canonical response with the provider rules in place. The current public checks cover the existing deployment; the local adapter output does not establish how the newly deployed project rules will interact with domain rules.

Submit the sitemap through already authorized Search Console/Bing properties and inspect representative Spanish/English pages. Unknown paths must respond with HTTP 404, `noindex, follow`, and no canonical, alternate or page schema. Social networks may retain cached cards; JPEG generation and correct Open Graph metadata do not prove a refreshed remote preview.

`robots.txt` explicitly allows Google, Bing, OpenAI search/user agents and Claude search/user agents while preserving training opt-outs, including GPTBot, Google-Extended, CCBot and ClaudeBot. [OpenAI's bot documentation](https://developers.openai.com/api/docs/bots) and [Anthropic's crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) describe distinct search, user-requested retrieval and training purposes. Robots directives express preferences; they are not an access-control mechanism or an indexing/citation guarantee. OpenAI notes that user-initiated retrieval may not follow robots directives.

## Local evidence and remaining checks

The build verifier checks initial single-language HTML on all indexable routes, exact metadata and canonical URLs, reciprocal alternates, genuine language links, stable schema identity, factual project text, internal links/anchors, adapter HTML copies, sitemap completeness, noindex 404, social JPEG and unchanged canonical PDF bytes.

The repository's existing Lighthouse gate runs five mobile measurements of the Spanish homepage with unchanged category and metric budgets. It does not cover all 12 routes, desktop behavior or field performance. Separate browser checks should cover Spanish/English desktop/mobile language navigation, keyboard focus, theme, reduced motion and case-study links using the static build.

On 2026-10-10, production deployment `dpl_4vnRiHtjP6QgrGaPk9ADnzTMymz5` served reviewed application SHA `2292a289f79ed62cbbe4f58323e56ebff486d7a6`. Public checks confirmed all 12 routes, sitemap completeness, both removed Solutec URLs returning 404/noindex, apex/www and trailing-slash redirects preserving queries, unchanged canonical PDFs and the JPEG social image. The production browser loaded the official analytics script. The separate CI performance failure is tracked in `odd/tasks/portfolio-content-refinement.md`; deployment success does not establish a passing CI result.

Production analytics reception, Search Console/Bing access and reports, indexing, field performance and remote social-preview rendering remain NOT_RUN until authorized access and observed evidence are available. Script delivery and page availability do not prove measurement reception, indexing, rankings or AI citations.
