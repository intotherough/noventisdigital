import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const PortalPage = lazy(() =>
  import('./pages/PortalPage').then((module) => ({ default: module.PortalPage })),
)
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })),
)
const LabsPage = lazy(() =>
  import('./pages/LabsPage').then((module) => ({ default: module.LabsPage })),
)

type RouteMeta = {
  title: string
  description: string
  robots: string
  canonicalPath: string
}

const SITE_ORIGIN = 'https://noventisdigital.co.uk'
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/social-card.png`

function upsertHeadTag(
  selector: string,
  create: () => HTMLMetaElement | HTMLLinkElement,
) {
  const existing = document.head.querySelector(selector)
  if (existing) {
    return existing as HTMLMetaElement | HTMLLinkElement
  }

  const element = create()
  document.head.appendChild(element)
  return element
}

function updateRouteMetadata(pathname: string) {
  const routeMeta: RouteMeta = pathname.startsWith('/admin')
    ? {
        title: 'Admin Console | Noventis Digital',
        description: 'Private admin console for Noventis Digital client and document management.',
        robots: 'noindex,nofollow',
        canonicalPath: '/admin',
      }
    : pathname.startsWith('/portal')
      ? {
          title: 'Client Portal | Noventis Digital',
          description: 'Private client portal for document access, project packs, and invoices.',
          robots: 'noindex,nofollow',
          canonicalPath: '/portal',
        }
      : pathname.startsWith('/privacy')
        ? {
            title: 'Privacy Policy | Noventis Digital',
            description:
              'Privacy policy for Noventis Digital, including how website enquiry data is handled.',
            robots: 'index,follow',
            canonicalPath: '/privacy',
          }
      : pathname.startsWith('/labs')
        ? {
            title: 'Labs | Noventis Digital',
            description:
              'Small interactive experiments in code, AI, and visual algorithms from Noventis Digital.',
            robots: 'index,follow',
            canonicalPath: '/labs',
          }
      : {
          title: 'Noventis Digital | Fractional CTO and AI Build Partner',
          description:
            'Fractional CTO, AI strategy, and hands-on engineering for companies that need technical judgment and delivery.',
          robots: 'index,follow',
          canonicalPath: '/',
        }

  const canonicalUrl = `${SITE_ORIGIN}${routeMeta.canonicalPath}`

  document.title = routeMeta.title

  const descriptionMeta = upsertHeadTag('meta[name="description"]', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    return meta
  })
  descriptionMeta.setAttribute('content', routeMeta.description)

  const robotsMeta = upsertHeadTag('meta[name="robots"]', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'robots')
    return meta
  })
  robotsMeta.setAttribute('content', routeMeta.robots)

  const canonicalLink = upsertHeadTag('link[rel="canonical"]', () => {
    const link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    return link
  })
  canonicalLink.setAttribute('href', canonicalUrl)

  const socialMetaTags: Array<[string, string, string]> = [
    ['meta[property="og:title"]', 'property', 'og:title'],
    ['meta[property="og:description"]', 'property', 'og:description'],
    ['meta[property="og:url"]', 'property', 'og:url'],
    ['meta[property="og:image"]', 'property', 'og:image'],
    ['meta[name="twitter:title"]', 'name', 'twitter:title'],
    ['meta[name="twitter:description"]', 'name', 'twitter:description'],
    ['meta[name="twitter:image"]', 'name', 'twitter:image'],
  ]

  for (const [selector, attributeName, attributeValue] of socialMetaTags) {
    const meta = upsertHeadTag(selector, () => {
      const element = document.createElement('meta')
      element.setAttribute(attributeName, attributeValue)
      return element
    })

    if (attributeValue.endsWith('title')) {
      meta.setAttribute('content', routeMeta.title)
      continue
    }

    if (attributeValue.endsWith('description')) {
      meta.setAttribute('content', routeMeta.description)
      continue
    }

    if (attributeValue.endsWith('url')) {
      meta.setAttribute('content', canonicalUrl)
      continue
    }

    meta.setAttribute('content', DEFAULT_OG_IMAGE)
  }
}

function RouteMetadata() {
  const location = useLocation()

  useEffect(() => {
    updateRouteMetadata(location.pathname)
  }, [location.pathname])

  return null
}

function App() {
  const location = useLocation()

  return (
    <>
      <RouteMetadata />
      <Suspense fallback={<div className="loading-panel">Loading...</div>}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/labs" element={<LabsPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/portal/*" element={<PortalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
