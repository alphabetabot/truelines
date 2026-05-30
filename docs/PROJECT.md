# TrueOddsIQ — project reference

**Site:** https://trueoddsiq.com  
**Repo:** truelines (this workspace)  
**Stack:** React + Vite SPA on Vercel · Supabase (auth + DB) · The Odds API · Anthropic/OpenAI (picks/analysis) · Resend (email)

**Product:** Live sportsbook odds comparison (6 books), daily AI picks (“Vega”), and a performance tracker. Not a sportsbook — informational/entertainment only, with 21+ responsible gambling messaging.

Treat **`main` as source of truth**; if this doc disagrees with the repo, trust the code.

---

## Monetization & tiers (direction)

| Tier | Today | Planned |
|------|--------|---------|
| **Public** | 1 top pick/day + brief edge (~2 sentences via `briefEdgeSummary`) | Same |
| **Free account** | All 3 daily newsletter picks, full write-ups, email, tracker | Same |
| **Premium** | Not built (teased on `/premium`) | Deep analysis per pick (injuries, weather, stats, long breakdowns) |

Stripe is **not** integrated yet; the operator plans ~1 week of stability before adding paid premium.

Constants: `src/lib/pickAccess.js` — `FREE_PUBLIC_PICK_COUNT = 1`, `DAILY_NEWSLETTER_PICK_COUNT = 3`.

---

## Routing

| URL | Behavior |
|-----|----------|
| `/` | Landing (`Welcome`) if logged out; redirect to `/odds` if signed in (`src/pages/Home.jsx`) |
| `/odds` | Live odds + scores (main app) |
| `/picks` | Daily AI picks (`AIPicks`) |
| `/welcome` | Same landing (campaign/UTM links) |
| `/premium` | Premium “coming soon” + waitlist |
| `/compare`, `/analysis`, `/blog`, `/login`, … | Standard app routes (`src/App.jsx`) |
| `/auth/reset` | Password reset |
| `/ai-sports-picks`, `/sportsbook-comparison` | SEO hubs (`src/seo/`) |
| `/odds/:sportSlug`, `/picks/:sportSlug` | SEO sport pages (mlb, nba, nfl, nhl) |

Invalid sport slug → 404. Logo (`LogoLink`) → `/`.

---

## Major work themes (chronological)

| Area | Summary |
|------|---------|
| **Scores** | `MAX_SCORES_DAYS_FROM = 3` (Odds API limit); score card winner bolding |
| **Copy** | Hero: “New picks every morning · Pacific time” |
| **Newsletter dedup** | Single cron `0 14 * * *` UTC (~7 AM Pacific); `newsletter-send-guard.js` claim-before-send; `newsletter_daily_sends` table |
| **Score ticker** | Pacific today filter, live detection, polling (`scoreUtils.js`, `ScoreTicker.jsx`) |
| **Fade of the Day** | Removed from product; exactly **3 actionable bets** only (legacy fade parsing remains for old data) |
| **Phase A — launch polish** | `/auth/reset`, 404, `logo.jpg`, `PageMeta`, lean homepage, campaign → `/welcome`, `pickText.js` public edge |
| **Phase B — marketing** | Cookie consent + GA4 Consent Mode; events `sign_up`, `login`, `sportsbook_click` |
| **Phase C** | `/welcome`, `/premium`, `SocialProofBar`, `PremiumTeaser`, honest sportsbook VISIT links |
| **Homepage routing** | `/` = landing for guests; signed-in → `/odds`; live tool at `/odds` |
| **SEO** | Isolated `src/seo/` module, nav row + footer guides, sitemap URLs in `api/sitemap.js` |

---

## Newsletter & crons

`vercel.json`:

- **Newsletter:** `0 14 * * *` UTC only → `/api/cron-newsletter`
- Also: `log-results`, `cron-blogs`, `cron-posts` on other schedules

`api/cron-newsletter.js`: 3 picks, no fade sections in prompts; filters `isFade` on output.

**Dedup:** `api/newsletter-send-guard.js` — Pacific date key, atomic claim on `newsletter_daily_sends` before Claude/email.

**Grading:** `api/log-results.js` matches scores to each pick’s `date` (not an earlier game in the same series). Every cron run re-verifies graded picks in the last ~45 days; MLB scores load for the full window. Manual full pass: `GET /api/log-results?regrade=true` with `Authorization: Bearer $CRON_SECRET`.

**SQL (run in Supabase if missing):**

- `api/create-newsletter-send-log.sql`
- `api/alter-newsletter-send-log.sql` (extend log table)

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
  components/        # SEOHero, SportsOddsPreview, etc.
  pages/             # SeoOddsSportPage, SeoPicksSportPage, …
```

**Behavior:**

- Use real `getOdds()` / `/api/todays-pick` when available
- Fallback copy: “Odds are currently unavailable. Check back closer to game time.”
- No fake odds or picks
- Responsible gambling disclaimer on every SEO page
- FAQ JSON-LD on hub pages

**Nav:** Row 1 — Live Odds, Line Compare. Row 2 — AI Analysis, AI Picks, Blog. Row 3 — SEO guides + sport odds/picks. Footer — guide grid + legal.

---

## Key paths

| Path | Role |
|------|------|
| `src/pages/Home.jsx` | Guest vs signed-in `/` routing |
| `src/pages/Welcome.jsx` | Landing |
| `src/pages/LiveOdds.jsx` | `/odds` |
| `src/lib/pickAccess.js` | Pick tier counts |
| `src/lib/pickText.js` | `briefEdgeSummary()` |
| `src/components/LogoLink.jsx` | Logo → `/`, `/logo.jpg` with `.svg` fallback |
| `api/newsletter-send-guard.js` | Newsletter idempotency |
| `public/logo.jpg` | Brand logo |
| `public/og-image.png`, `og-image.svg` | Social preview assets |
| `api/sitemap.js` | Dynamic sitemap (+ SEO URLs) |

---

## Environment

See `.env.example`. Server secrets must **not** use `VITE_` prefix. Required for full operation: Supabase, Odds API, AI keys, Resend, `CRON_SECRET`, `SITE_URL`.

---

## Intentionally not done yet

- Stripe / gated premium deep analysis
- Newsletter-only signup (no standalone email capture without account)
- Real affiliate tracking (when/if books approve)
- Dedicated shareable pick images (optional growth)
- Some meta tags may still reference `.png` while repo also has `og-image.svg`

---

## Suggested next steps

1. **Monitor:** one newsletter/day, morning picks, signup funnel in GA4
2. **Stripe:** gate premium deep analysis (not “more free picks”)
3. **SEO:** more blog ↔ landing internal links; Search Console review
4. **Keep this doc updated** when shipping major routing or product changes

---

## Git / branches

- **Base:** `main` — merge via GitHub PRs; Vercel auto-deploys `main`
- **Feature branches:** `cursor/<descriptive-name>-<suffix>` (e.g. `-20f4`, `-5264` per agent session)

---

## Agent / contributor preferences

- Minimal, focused diffs; do not break existing routes
- Honest copy (no fake affiliate links or guaranteed picks)
- Homepage stays **landing-first** for new visitors
- Premium, when built, means **deep analysis** (injuries, weather, stats), not extra free-tier picks
