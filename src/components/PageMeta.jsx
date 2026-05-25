import { useEffect } from 'react'

const SITE_URL = 'https://trueoddsiq.com'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector)
  if (el && value) el.setAttribute(attr, value)
}

export default function PageMeta({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
}) {
  useEffect(() => {
    const pagePath = path ?? window.location.pathname
    const canonical = `${SITE_URL}${pagePath}`
    document.title = title

    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', canonical)
    setMeta('meta[property="og:url"]', 'content', canonical)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:image"]', 'content', image)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', image)
  }, [description, image, path, title])

  return null
}
