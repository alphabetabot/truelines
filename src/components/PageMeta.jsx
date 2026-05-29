import { useEffect } from 'react'
import { buildCanonical, DEFAULT_OG_IMAGE } from '../lib/routeMeta'

function setMetaByName(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaByProperty(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export default function PageMeta({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  noindex = false,
}) {
  const pageTitle = title.includes('TrueOddsIQ') ? title : `${title} | TrueOddsIQ`
  const canonical = buildCanonical(path)
  const ogTitle = pageTitle

  useEffect(() => {
    document.title = pageTitle
    setMetaByName('description', description)
    setCanonical(canonical)

    setMetaByProperty('og:type', 'website')
    setMetaByProperty('og:url', canonical)
    setMetaByProperty('og:title', ogTitle)
    setMetaByProperty('og:description', description)
    setMetaByProperty('og:image', image)
    setMetaByProperty('og:image:type', image.endsWith('.svg') ? 'image/svg+xml' : 'image/png')
    setMetaByProperty('og:image:width', '1200')
    setMetaByProperty('og:image:height', '630')
    setMetaByProperty('og:site_name', 'TrueOddsIQ')

    setMetaByName('twitter:card', 'summary_large_image')
    setMetaByName('twitter:title', ogTitle)
    setMetaByName('twitter:description', description)
    setMetaByName('twitter:image', image)

    setMetaByName('robots', noindex ? 'noindex, nofollow' : 'index, follow')
  }, [pageTitle, description, canonical, ogTitle, image, noindex])

  return null
}
