# Newsletter: one email per day

## Intended schedule

- **Only** Vercel cron: `0 14 * * *` UTC → `/api/cron-newsletter`
- **~7:00–7:10 AM Pacific** (Resend delivery often shows ~7:05 AM)

**Vercel dashboard must show:** `/api/cron-newsletter` with `0 14 * * *` (daily). If it shows `0 8 * * 1` (Mondays only), crons are mis-registered — redeploy `main` after the `vercel.json` fix that uses unique paths (no `?query` on cron paths, no duplicate `/api/log-results` paths).

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

`newsletter.status`: `not_started` | `in_progress` | `stale_in_progress` | `sent`

## Manual resend (recovery only)

**Easiest:** Vercel → Project → **Cron Jobs** → `/api/cron-newsletter` → **Run** (add `?force=true` if the UI allows query params).

Or from terminal:

```bash
curl -sS "https://www.trueoddsiq.com/api/cron-newsletter?force=true" \
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
