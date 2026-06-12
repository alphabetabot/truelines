# TrueOddsIQ — project reference

**Site:** https://www.trueoddsiq.com (use **www** for API/cron calls; apex redirects)  
**Repo:** truelines (this workspace)  
**Stack:** React + Vite SPA on Vercel · Supabase (auth + DB) · The Odds API · Anthropic (newsletter picks) · OpenAI (analysis) · Resend (email)

**Product:** Live sportsbook odds comparison (6 books), daily AI picks (“Vega”), and a **public performance tracker**. Not a sportsbook — informational/entertainment only, with 21+ responsible gambling messaging.

**Owner priority:** Tracker accuracy and **one newsletter per day** (~7:05 AM Pacific) before big new features (Stripe premium, Phase 4 favorites, CLV pipeline, etc.).

Treat **`main` as source of truth**; if this doc disagrees with the repo, trust the code.

---

## Monetization & tiers (direction)

| Tier | Today | Planned |
|------|--------|---------|
| **Public** | 1 top pick/day + brief edge (~2 sentences via `briefEdgeSummary`) | Same |
| **Free account** | All 3 daily newsletter picks, full write-ups, email, tracker | Same |
| **Premium** | Not built (teased on `/premium`) | Deep analysis per pick (injuries, weather, stats, long breakdowns) |

Stripe is **not** integrated yet; stability first (~1 week) before paid premium.

Constants: `src/lib/pickAccess.js` — `FREE_PUBLIC_PICK_COUNT = 1`, `DAILY_NEWSLETTER_PICK_COUNT = 3`.

---

## Routing

| URL | Behavior |
|-----|----------|
| `/` | Landing (`Welcome`) if logged out; redirect to `/odds` if signed in (`src/pages/Home.jsx`) |
| `/odds` | Live odds + scores (main app); score ticker + `StickyOddsToolbar` + `DailyPickTeaser` |
| `/compare`, `/analysis`, `/picks` | App workspace — compact nav, collapsible score ticker (`src/lib/appRoutes.js`) |
| `/picks` | Full daily AI picks (`AIPicks`) |
| `/welcome` | Same landing (campaign/UTM links) |
| `/premium` | Premium “coming soon” + waitlist |
| `/blog`, `/login`, … | Standard app routes (`src/App.jsx`) |
| `/auth/reset` | Password reset |
| `/ai-sports-picks`, `/sportsbook-comparison` | SEO hubs (`src/seo/`) |
| `/odds/:sportSlug`, `/picks/:sportSlug` | SEO sport pages (mlb, nba, nfl, nhl) |

Invalid sport slug → 404. Logo (`LogoLink`) → `/`.

---

## Phase 3 — product & analytics

| Area | Implementation |
|------|----------------|
| **Default sport** | `src/lib/defaultSport.js` — seasonal default (MLB summer, NFL fall, March Madness NCAAB); `useSportSelection` hook |
| **Best Available Value** | `TodaysEdges.jsx` — highlights best line across books |
| **Feature flags** | `src/lib/featureFlags.js` — premium/splits gates off until backends exist; `PremiumFeatureSlot` |
| **Analytics** | `src/lib/analytics.js` — GA4 `G-W6K2P39FPD`; events include `sign_up`, `login`, `sportsbook_click`, `daily_pick_teaser_click` |

Tests: `npm run test:default-sport`, `npm run test:pick-performance`.

---

## Phase 3.5 — wayfinding & SEO nav

| Area | Implementation |
|------|----------------|
| **App nav** | Compact labels on `/odds`, `/compare`, `/analysis`, `/picks` (`Layout.jsx`) |
| **Score ticker** | Full ticker on `/odds`; collapsible on compare/analysis/picks |
| **Scores tab** | Padding / “Final” label clipping fixes (`Scores.jsx`) |
| **SEO sub-nav** | `SeoNavBar` — hubs (Picks Guide, Books) + **league names only** (MLB, NBA, NFL, NHL); no duplicate “Odds Picks” row (`seoNavLinks.js`, PR #61–62) |

---

## Major work themes (chronological)

| Area | Summary |
|------|---------|
| **Scores** | `MAX_SCORES_DAYS_FROM = 3` (Odds API limit); score card winner bolding |
| **Copy** | Hero: “New picks every morning · Pacific time” |
| **Newsletter dedup** | Single Vercel cron `0 14 * * *` UTC; claim-before-send; `newsletter_daily_sends`; POST `/api/newsletter` → 410; external cron blocked (PR #67–68) |
| **Tracker grading** | Pacific `pick.date`; no ±1 day fallback; integrity regrade ~45 days (PR #63–66) |
| **Vercel limits** | Hobby max 12 serverless functions — legacy cron URLs via `vercel.json` rewrites, not extra API files (PR #65) |
| **Score ticker** | Pacific today filter, live detection, polling (`scoreUtils.js`, `ScoreTicker.jsx`) |
| **Fade of the Day** | Removed from product; exactly **3 actionable bets** only (legacy fade parsing remains for old data) |
| **Phase A–C** | Auth reset, 404, GA4 consent, `/welcome`, `/premium`, honest sportsbook VISIT links |
| **Homepage routing** | `/` = landing for guests; signed-in → `/odds` |
| **SEO** | Isolated `src/seo/` module, sitemap in `api/sitemap.js` |

---

## Newsletter & crons

Full schedule in `vercel.json`:

| Schedule (UTC) | Path | Purpose |
|----------------|------|---------|
| `0 14 * * *` | `/api/cron-newsletter` | Daily picks email (~7:05 AM Pacific) |
| `0 7 * * *` | `/api/cron-blogs` | Blog generation |
| `0 8 * * 1` | `/api/cron-blogs-weekly` | Weekly blog (rewrite → `cron-blogs?weekly=true`) |
| `0 12 * * *` | `/api/cron-midday-post` | Midday X post (rewrite → `cron-posts`) |
| `0 18 * * *` | `/api/cron-evening-post` | Evening X post (rewrite → `cron-posts?evening=true`) |
| `30 12`, `30 18`, `0 5 * * *` | `/api/cron-grade-midday`, `-evening`, `-early` | Grade picks + integrity pass (rewrites → `log-results`) |

**Legacy rewrites (no extra API files):** `/api/cron-midday-post` → `cron-posts`; `/api/cron-evening-post` → `cron-posts?evening=true`.

`api/cron-newsletter.js`: 3 picks, no fade sections in prompts; filters `isFade` on output.

### Dedup (one email per day)

- **Guard:** `api/newsletter-send-guard.js` — Pacific date key (`api/date-utils.js`), atomic **claim** on `newsletter_daily_sends` **before** Claude/Resend.
- **Record after send:** Successful delivery updates `sent_at` so retries do not double-send.
- **Triggers:** Only Vercel cron `0 14 * * *` (or `?force=true` + `CRON_SECRET` for recovery). Non-Vercel callers get `external_trigger_disabled` even with `NEWSLETTER_SECRET`.
- **Wrong schedule:** Extra Vercel cron (e.g. `0 15 * * *`) is rejected via `x-vercel-cron-schedule` check.
- **Retired:** `POST /api/newsletter` → **410** (unsubscribe still works on that route).

See **`docs/NEWSLETTER-DEDUP.md`** for troubleshooting duplicate emails.

### Owner verification checklist (newsletter)

1. **cron-job.org** — Owner must disable/delete **all** TrueOddsIQ jobs (newsletter, log-results, etc.). Vercel alone is sufficient. Code blocks external newsletter triggers, but old jobs still waste calls and confused ops.
2. **Vercel → Project → Settings → Cron Jobs** — Exactly **one** `/api/cron-newsletter` at `0 14 * * *` UTC (UI may show “2:00 PM” = 14:00 UTC).
3. **After ~7:05 AM Pacific** — Supabase: `SELECT * FROM newsletter_daily_sends ORDER BY date DESC LIMIT 3` → one row/day with `sent_at` set.
4. **If duplicates persist** — Resend dashboard; duplicate active subscribers (`GROUP BY email HAVING COUNT(*) > 1`).

**Production checks (agent, Jun 2026):** `POST https://www.trueoddsiq.com/api/newsletter` → 410 with retire message. Unauthenticated `GET /api/cron-newsletter` → 401. All grading-related tests pass locally.

**Manual resend (recovery only):**

```bash
curl -sS "https://www.trueoddsiq.com/api/cron-newsletter?force=true" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Performance tracker (grading)

**Pipeline:** `api/cron-newsletter.js` → `storePicks()` → Supabase `daily_picks` → `api/log-results.js` grades + integrity regrade (~45 days) → UI `PerformanceTracker.jsx` via `/api/performance-picks.js`.

**Root cause fixed (May 2026):** Same teams on consecutive days (MLB series) — grader used yesterday’s score when ±1 day fallback ran or early cron ran before finals.

**Current logic** (`api/pick-utils.js`, `api/grading-scores.js`, `api/date-utils.js`):

- Picks stored with **Pacific date** (`pacificDateKey`).
- Match finals **only** on `pick.date` — **no ±1 day fallback**.
- Finals carry `pacific_date` where applicable.
- Every `log-results` run re-verifies graded picks in the last ~45 days.

**Manual regrade:**

```bash
curl -sS "https://www.trueoddsiq.com/api/log-results" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**One-off SQL:** `api/fix-tracker-grades.sql`, `api/fix-may31-grades.sql` (May 31, 2026 series-date correction).

**Tests:** `npm run test:grading`

**SQL (run in Supabase if missing):**

- `api/create-newsletter-send-log.sql`
- `api/alter-newsletter-send-log.sql`

---

## Vercel deploy constraints

- **Hobby plan:** Max **12** serverless functions under `api/`. Count `api/*.js` before adding routes; use **rewrites** or consolidate handlers.
- **Failed deploy** = previous production code still live — always confirm deploy succeeded after tracker/newsletter fixes.
- **Primary domain:** Set Vercel primary to `www.trueoddsiq.com` so crons and manual curls do not hit apex redirect loops.

---

## Sportsbook links & affiliates

No affiliate programs today. **VISIT** buttons open book homepages; disclosure: not affiliated, no commission.

- Logic: `src/lib/affiliateLinks.js`, `src/lib/affiliateDisclosure.js`
- Optional `VITE_AFFILIATE_*` env vars override URL only — not “affiliate mode” in UI
- Analytics: `sportsbook_click` (not `affiliate_click`)

Books compared: DraftKings, FanDuel, BetMGM, Caesars (`williamhill_us`), Pinnacle, Bet365.

---

## Analytics & compliance

- **GA4:** `G-W6K2P39FPD` (`src/lib/analytics.js`)
- Consent banner: Accept/Decline analytics; Consent Mode v2
- Footer: Cookie preferences (`CookieConsent.jsx`)
- Privacy policy updated for banner

---

## SEO module

```
src/seo/
  seoContent.js      # Copy, meta, FAQs, sport slugs
  seoNavLinks.js     # Nav + footer link lists
  seoRoutes.jsx      # Registered in App.jsx
  components/        # SEOHero, SeoNavBar, SportsOddsPreview, etc.
  pages/             # SeoOddsSportPage, SeoPicksSportPage, …
```

**Behavior:**

- Use real `getOdds()` / `/api/todays-pick` when available
- Fallback copy: “Odds are currently unavailable. Check back closer to game time.”
- No fake odds or picks
- Responsible gambling disclaimer on every SEO page
- FAQ JSON-LD on hub pages

**Nav:** App routes use compact primary nav. SEO pages use `SeoNavBar` (guides + MLB/NBA/NFL/NHL). Footer — guide grid + legal.

---

## Key paths

| Path | Role |
|------|------|
| `src/pages/Home.jsx` | Guest vs signed-in `/` routing |
| `src/pages/LiveOdds.jsx` | `/odds` + toolbar + pick teaser |
| `src/lib/appRoutes.js` | App workspace vs SEO nav/ticker rules |
| `src/lib/defaultSport.js` | Seasonal default sport |
| `src/lib/pickAccess.js` | Pick tier counts |
| `src/lib/pickText.js` | `briefEdgeSummary()` |
| `src/components/PerformanceTracker.jsx` | Public W/L tracker UI |
| `src/components/LogoLink.jsx` | Logo → `/` |
| `api/cron-newsletter.js` | Daily send + store picks |
| `api/newsletter-send-guard.js` | Newsletter idempotency |
| `api/log-results.js` | Grading cron |
| `api/pick-utils.js` | Shared pick/grade helpers |
| `api/sitemap.js` | Dynamic sitemap (+ SEO URLs) |
| `vercel.json` | Crons, rewrites, www redirect |

---

## Environment

See `.env.example`. Server secrets must **not** use `VITE_` prefix.

| Secret | Use |
|--------|-----|
| `CRON_SECRET` | Vercel crons, manual `log-results`, `cron-newsletter?force=true` |
| `NEWSLETTER_SECRET` | Legacy; daily send should be Vercel cron only |
| Supabase, Odds API, Anthropic, Resend, `SITE_URL` | Core operation |

---

## Owner ops cheat sheet

| Task | Where |
|------|--------|
| Active subscriber count | Supabase → `newsletter_subscribers` where `active = true` |
| Cron jobs | Vercel → **truelines** project → Settings → **Cron Jobs** (not Team Settings) |
| Fix tracker DB | `log-results` curl or wait for cron; SQL in `api/fix-*.sql` if needed |
| Duplicate emails | Disable all jobs on **cron-job.org**; keep one newsletter cron on Vercel; see `docs/NEWSLETTER-DEDUP.md` |
| Newsletter send log | `newsletter_daily_sends` in Supabase |

---

## Intentionally not done yet

- Stripe / gated premium deep analysis
- Phase 4 “favorite teams” (wait for GA4 + stability)
- CLV / closing line pipeline
- Forums / community
- Newsletter-only signup (no standalone email capture without account)
- Real affiliate tracking (when/if books approve)
- Cursor Automations for monitoring (optional, discussed)

---

## Suggested next steps

1. **Owner:** Confirm cron-job.org account has **zero** TrueOddsIQ jobs; verify one newsletter tomorrow ~7:05 AM PT and one `newsletter_daily_sends` row.
2. **Monitor:** signup funnel in GA4; tracker W/L after late games (evening + 05:00 UTC log-results).
3. **Stripe:** gate premium deep analysis when stable (not “more free picks”).
4. **Keep this doc updated** when shipping routing, grading, or cron changes.

---

## Git / branches

- **Base:** `main` — merge via GitHub PRs; Vercel auto-deploys `main`
- **Feature branches:** `cursor/<descriptive-name>-<suffix>` (e.g. `-5264`, `-7537` per agent session)

---

## Agent / contributor preferences

- Minimal, focused diffs; do not break existing routes
- Honest copy (no fake affiliate links or guaranteed picks)
- Homepage stays **landing-first** for new visitors
- Premium, when built, means **deep analysis** (injuries, weather, stats), not extra free-tier picks
- **Tracker and newsletter reliability** trump new features until owner signs off
