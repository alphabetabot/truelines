# Newsletter: one email per day

## Intended schedule (3-step pipeline)

Each step is a **separate cron** so a timeout during Claude cannot block email delivery.

| Schedule (UTC) | Path | Step |
|----------------|------|------|
| `0 14 * * *` | `/api/cron-newsletter-generate` | Fetch slate → Claude → store picks |
| `30 14 * * *` | `/api/cron-newsletter-send` | Resend email from stored picks |
| `45 14 * * *` | `/api/cron-newsletter-send-catchup` | Retry send (runs generate first if no picks) |
| `50 14 * * *` | `/api/cron-newsletter-social` | Telegram + X posts |

**Vercel dashboard must show** all four paths above after deploy. Status phases: `not_started` → `generating` → `picks_ready` → `sent` (or `generate_failed` / `send_failed` — never silently deleted).

## If you get two emails

1. **Vercel → Project → Settings → Cron Jobs**  
   Delete any extra job for `/api/cron-newsletter` or `/api/newsletter`, especially **`0 15 * * *`** (8 AM Pacific duplicate).

2. **cron-job.org**  
   Disable/delete any job hitting:
   - `https://www.trueoddsiq.com/api/newsletter`
   - `https://www.trueoddsiq.com/api/cron-newsletter`  
   (Vercel already runs the newsletter.)

3. **Supabase** — confirm dedup table exists:

```sql
SELECT * FROM newsletter_daily_sends ORDER BY date DESC LIMIT 7;
```

You should see **one row per calendar day** after a successful send (`sent_at` filled in).

4. **Duplicate subscriber rows** (rare):

```sql
SELECT email, COUNT(*) FROM newsletter_subscribers
WHERE active = true GROUP BY email HAVING COUNT(*) > 1;
```

## Check today’s send status

```bash
curl -sS "https://www.trueoddsiq.com/api/picks-status" | jq '.newsletter, .dates.pacificToday, .today.total'
```

`newsletter.status` / `newsletter.phase`: `not_started` | `generating` | `picks_ready` | `sending` | `sent` | `generate_failed` | `send_failed` | `stale_in_progress`

## Manual resend (recovery only)

**Easiest:** Vercel → Project → **Cron Jobs** → `/api/cron-newsletter` → **Run** (add `?force=true` if the UI allows query params).

Or from terminal:

```bash
# Full pipeline (generate → send → social). Use this when picks were never stored.
curl -sS "https://www.trueoddsiq.com/api/cron-newsletter?force=true" \
  -H "Authorization: Bearer $CRON_SECRET"

# Send-only retry (skips generate). Only use when picks are already in daily_picks.
curl -sS "https://www.trueoddsiq.com/api/cron-newsletter?force=true&emailsOnly=true" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Or via picks-status (clears stuck claim + runs force send):

```bash
curl -sS "https://www.trueoddsiq.com/api/picks-status?action=newsletter-recovery" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Use only when the morning send failed. `force=true` skips the daily claim and clears a stuck in-progress row for that Pacific date.

## If cron keeps skipping (`send_in_progress`)

A failed run used to leave `newsletter_daily_sends` with `sent_at` null, blocking the rest of the day. The guard now auto-releases claims older than **15 minutes** and releases claims on all failure paths.

**Do not** add `cron-newsletter` to `vercel.json` → `functions` — that caused production deploy failures on this project.
