import { useLocation } from 'react-router-dom'
import { useSEO, getRouteSEO } from '@/shared/seo'

/**
 * RouteSEO component
 * Mounts within the Router tree and updates document metadata on navigation
 * according to the route metadata registry.
 */
export function RouteSEO() {
  const location = useLocation()
  const seoConfig = getRouteSEO(location.pathname)

  useSEO({
    title: seoConfig.title,
    description: seoConfig.description,
    canonical: `https://ryokai-dev.vercel.app${location.pathname === '/' ? '' : location.pathname}`,
    noindex: seoConfig.noindex,
  })

  return null
}
