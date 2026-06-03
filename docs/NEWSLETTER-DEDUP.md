# Newsletter: one email per day

## Intended schedule

- **Only** Vercel cron: `0 14 * * *` UTC → `/api/cron-newsletter`
- **~7:00–7:10 AM Pacific** (Resend delivery often shows ~7:05 AM)

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

## Manual resend (recovery only)

```bash
curl -sS "https://www.trueoddsiq.com/api/cron-newsletter?force=true" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Use only when the morning send failed; dedup still applies unless the day was already marked sent.
