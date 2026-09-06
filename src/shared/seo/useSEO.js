import { useEffect } from 'react'

const BASE_URL = 'https://ryokai-dev.vercel.app'
const DEFAULT_TITLE = 'Ryokai — The system for turning intent into execution'
const DEFAULT_DESCRIPTION = 'Ryokai helps engineering teams manage tasks more effectively with real-time collaboration, tracking, and dependencies.'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`

/**
 * Helper to update or inject a <meta> tag into document.head
 */
function setMetaTag(selector, attrName, attrValue, content) {
  if (typeof document === 'undefined') return
  if (!content && content !== '') return
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Helper to update or inject a <link> tag into document.head
 */
function setLinkTag(selector, rel, href) {
  if (typeof document === 'undefined') return
  if (!href) return
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Production-grade lightweight SEO hook for React 19 / SPA.
 * Automatically synchronizes document.title, meta tags (description, OpenGraph, Twitter),
 * canonical URL link, and robots index/noindex directives per route.
 */
export function useSEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
  noindex,
} = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    // 1. Title formatting
    const formattedTitle = title
      ? title.includes('Ryokai')
        ? title
        : `${title} | Ryokai`
      : DEFAULT_TITLE

    document.title = formattedTitle

    // 2. Meta description
    const effectiveDescription = description || DEFAULT_DESCRIPTION
    setMetaTag('meta[name="description"]', 'name', 'description', effectiveDescription)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', effectiveDescription)

    // 3. OpenGraph & Twitter title
    const effectiveOgTitle = ogTitle || formattedTitle
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', effectiveOgTitle)
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', effectiveOgTitle)

    // 4. OpenGraph description
    const effectiveOgDesc = ogDescription || effectiveDescription
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', effectiveOgDesc)

    // 5. OpenGraph & Twitter Image
    const effectiveImage = ogImage || DEFAULT_OG_IMAGE
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', effectiveImage)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', effectiveImage)

    // 6. Canonical URL and og:url
    let effectiveCanonical = canonical
    if (!effectiveCanonical && typeof window !== 'undefined') {
      const cleanPath = window.location.pathname.replace(/\/$/, '') || '/'
      effectiveCanonical = `${BASE_URL}${cleanPath === '/' ? '' : cleanPath}`
    }
    if (effectiveCanonical) {
      setLinkTag('link[rel="canonical"]', 'canonical', effectiveCanonical)
      setMetaTag('meta[property="og:url"]', 'property', 'og:url', effectiveCanonical)
    }

    // 7. Robots (index/follow vs noindex/nofollow)
    if (typeof noindex === 'boolean') {
      const robotsDirective = noindex ? 'noindex, nofollow' : 'index, follow'
      setMetaTag('meta[name="robots"]', 'name', 'robots', robotsDirective)
    }
  }, [title, description, ogTitle, ogDescription, ogImage, canonical, noindex])
}

/**
 * Declarative component wrapper for useSEO
 */
export function MetaTags(props) {
  useSEO(props)
  return null
}
