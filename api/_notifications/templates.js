const SITE_ORIGIN = (process.env.SITE_URL || 'https://www.trueoddsiq.com').replace(/\/$/, '')

export function buildFreePickNotificationEmail({ unsubscribeHref }) {
  const pickUrl = `${SITE_ORIGIN}/free-picks`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:28px;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hello,</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Today&apos;s official TrueOddsIQ AI pick is now available.</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">View the complete analysis, current odds, and recommendation by visiting TrueOddsIQ.</p>
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${pickUrl}" style="display:inline-block;background:#f5b800;color:#0a0a0a;padding:14px 28px;border-radius:10px;font-weight:800;text-decoration:none;">View Today&apos;s Pick</a>
    </p>
    <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">Good luck!</p>
    <p style="margin:0;font-size:16px;line-height:1.6;">— TrueOddsIQ</p>
    ${unsubscribeHref ? `<p style="margin-top:24px;font-size:12px;color:#888;"><a href="${unsubscribeHref}" style="color:#888;">Unsubscribe</a></p>` : ''}
  </div>
</body></html>`

  const text = [
    'Hello,',
    '',
    "Today's official TrueOddsIQ AI pick is now available.",
    '',
    'View the complete analysis, current odds, and recommendation by visiting TrueOddsIQ.',
    '',
    `View Today's Pick: ${pickUrl}`,
    '',
    'Good luck!',
    '',
    '— TrueOddsIQ',
  ].join('\n')

  return {
    subject: "✅ Today's Free Pick Is Live",
    html,
    text,
  }
}

export function buildPremiumPickNotificationEmail({ pickNumber, unsubscribeHref }) {
  const pickUrl = `${SITE_ORIGIN}/picks#todays-slate`
  const label = pickNumber ? `Premium Pick #${pickNumber}` : 'Premium Pick'
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:28px;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A new Premium AI pick has just been released.</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Log into your TrueOddsIQ account to view:</p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.7;">
      <li>Full AI analysis</li>
      <li>Edge Score</li>
      <li>Fair Odds</li>
      <li>Expected Value</li>
      <li>Sportsbook Odds</li>
      <li>Key matchup advantages</li>
    </ul>
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${pickUrl}" style="display:inline-block;background:#f5b800;color:#0a0a0a;padding:14px 28px;border-radius:10px;font-weight:800;text-decoration:none;">View Premium Pick</a>
    </p>
    <p style="margin:0;font-size:14px;color:#aaa;">${label} — details are only available on the site.</p>
    ${unsubscribeHref ? `<p style="margin-top:24px;font-size:12px;color:#888;"><a href="${unsubscribeHref}" style="color:#888;">Unsubscribe from pick alerts</a></p>` : ''}
  </div>
</body></html>`

  const text = [
    'A new Premium AI pick has just been released.',
    '',
    'Log into your TrueOddsIQ account to view full AI analysis, Edge Score, Fair Odds, Expected Value, sportsbook odds, and key matchup advantages.',
    '',
    `View Premium Pick: ${pickUrl}`,
  ].join('\n')

  return {
    subject: '🔥 New Premium Pick Available',
    html,
    text,
  }
}

export function buildNoFreePickEmail({ unsubscribeHref }) {
  const siteUrl = SITE_ORIGIN
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:28px;">
    <p style="margin:0 0 16px;font-size:18px;font-weight:800;">Today&apos;s AI Update</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">No game met the TrueOddsIQ standards for expected value and betting edge today.</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Rather than forcing a wager, we chose discipline.</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Continue checking TrueOddsIQ for live odds and future opportunities.</p>
    <p style="text-align:center;margin:0;">
      <a href="${siteUrl}" style="display:inline-block;background:#22c55e;color:#0a0a0a;padding:12px 24px;border-radius:10px;font-weight:700;text-decoration:none;">Visit TrueOddsIQ</a>
    </p>
    ${unsubscribeHref ? `<p style="margin-top:24px;font-size:12px;color:#888;"><a href="${unsubscribeHref}" style="color:#888;">Unsubscribe</a></p>` : ''}
  </div>
</body></html>`

  const text = [
    "Today's AI Update",
    '',
    'No game met the TrueOddsIQ standards for expected value and betting edge today.',
    '',
    'Rather than forcing a wager, we chose discipline.',
    '',
    'Continue checking TrueOddsIQ for live odds and future opportunities.',
    '',
    siteUrl,
  ].join('\n')

  return {
    subject: "Today's AI Update",
    html,
    text,
  }
}
