import crypto from 'crypto'

// OAuth 1.0a helper
function oauthSign(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params).sort().map(k =>
    `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
  ).join('&')

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&')

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')
}

function buildAuthHeader(method, url, extraParams = {}) {
  const oauthParams = {
    oauth_consumer_key: process.env.X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.X_ACCESS_TOKEN,
    oauth_version: '1.0',
    ...extraParams,
  }

  const allParams = { ...oauthParams, ...extraParams }
  oauthParams.oauth_signature = oauthSign(
    method, url, allParams,
    process.env.X_API_SECRET,
    process.env.X_ACCESS_TOKEN_SECRET
  )

  const headerParts = Object.entries(oauthParams)
    .filter(([k]) => k.startsWith('oauth_'))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')

  return `OAuth ${headerParts}`
}

export async function postTweet(text) {
  const url = 'https://api.twitter.com/2/tweets'
  const authHeader = buildAuthHeader('POST', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`X API error: ${JSON.stringify(data)}`)
  return data
}
