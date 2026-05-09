// Dynamic sitemap generator - pulls blog posts from Supabase in real-time
// Serves as /api/sitemap and should be aliased to /sitemap.xml in vercel.json

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const STATIC_PAGES = [
  { loc: 'https://trueoddsiq.com/', changefreq: 'hourly', priority: '1.0' },
  { loc: 'https://trueoddsiq.com/compare', changefreq: 'hourly', priority: '0.9' },
  { loc: 'https://trueoddsiq.com/analysis', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://trueoddsiq.com/picks', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://trueoddsiq.com/disclaimer', changefreq: 'monthly', priority: '0.3' },
  { loc: 'https://trueoddsiq.com/blog', changefreq: 'daily', priority: '0.8' },
]

const STATIC_BLOG_POSTS = [
  { slug: 'how-to-shop-betting-lines', changefreq: 'monthly', priority: '0.7' },
  { slug: 'how-to-read-mlb-betting-odds', changefreq: 'monthly', priority: '0.7' },
  { slug: 'vega-ai-picks-how-it-works', changefreq: 'monthly', priority: '0.7' },
]

export default async function handler(req, res) {
  try {
    // Fetch all blog posts from Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,date&order=date.desc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch blog posts')
    }

    const blogPosts = await response.json()

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Add static pages
    STATIC_PAGES.forEach(page => {
      xml += '  <url>\n'
      xml += `    <loc>${page.loc}</loc>\n`
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`
      xml += `    <priority>${page.priority}</priority>\n`
      xml += '  </url>\n'
    })

    // Add static blog posts
    STATIC_BLOG_POSTS.forEach(post => {
      xml += '  <url>\n'
      xml += `    <loc>https://trueoddsiq.com/blog/${post.slug}</loc>\n`
      xml += `    <changefreq>${post.changefreq}</changefreq>\n`
      xml += `    <priority>${post.priority}</priority>\n`
      xml += '  </url>\n'
    })

    // Add dynamic blog posts from Supabase
    blogPosts.forEach(post => {
      if (post.slug) {
        xml += '  <url>\n'
        xml += `    <loc>https://trueoddsiq.com/blog/${post.slug}</loc>\n`
        xml += '    <changefreq>monthly</changefreq>\n'
        xml += '    <priority>0.7</priority>\n'
        if (post.date) {
          xml += `    <lastmod>${post.date}</lastmod>\n`
        }
        xml += '  </url>\n'
      }
    })

    xml += '</urlset>'

    // Return as XML with proper headers
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    return res.send(xml)
  } catch (err) {
    console.error('Sitemap generation error:', err)
    return res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>')
  }
}
