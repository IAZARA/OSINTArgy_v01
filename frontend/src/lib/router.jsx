import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const RouterContext = createContext(null)
const ParamsContext = createContext({})

const readLocation = () => ({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  state: window.history.state,
})

const normalizePathname = (pathname) => {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '')
}

const matchPath = (pattern, pathname) => {
  const patternSegments = normalizePathname(pattern).split('/').filter(Boolean)
  const pathSegments = normalizePathname(pathname).split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) return null

  const params = {}

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]
    const pathSegment = pathSegments[index]

    if (patternSegment.startsWith(':')) {
      const paramName = patternSegment.slice(1)

      try {
        params[paramName] = decodeURIComponent(pathSegment)
      } catch {
        params[paramName] = pathSegment
      }
    } else if (patternSegment !== pathSegment) {
      return null
    }
  }

  return params
}

export function BrowserRouter({ children }) {
  const [location, setLocation] = useState(readLocation)

  useEffect(() => {
    const handlePopState = () => setLocation(readLocation())
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      window.history.go(to)
      return
    }

    const destination = new URL(to, window.location.href)
    const nextPath = `${destination.pathname}${destination.search}${destination.hash}`
    const method = options.replace ? 'replaceState' : 'pushState'

    window.history[method](options.state ?? null, '', nextPath)
    setLocation(readLocation())
  }, [])

  const value = useMemo(
    () => ({ location, navigate }),
    [location, navigate],
  )

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  )
}

export function useLocation() {
  const router = useContext(RouterContext)

  if (!router) {
    throw new Error('useLocation debe utilizarse dentro de BrowserRouter')
  }

  return router.location
}

export function useNavigate() {
  const router = useContext(RouterContext)

  if (!router) {
    throw new Error('useNavigate debe utilizarse dentro de BrowserRouter')
  }

  return router.navigate
}

export function useParams() {
  return useContext(ParamsContext)
}

export function Routes({ children }) {
  const location = useLocation()
  const routes = React.Children.toArray(children)

  for (const route of routes) {
    const params = matchPath(route.props.path, location.pathname)

    if (params) {
      return (
        <ParamsContext.Provider value={params}>
          {route.props.element}
        </ParamsContext.Provider>
      )
    }
  }

  return null
}

export function Route() {
  return null
}

export function Link({
  to,
  replace = false,
  state = null,
  onClick,
  target,
  children,
  ...props
}) {
  const navigate = useNavigate()

  const handleClick = (event) => {
    onClick?.(event)

    const isModifiedClick = event.metaKey || event.altKey || event.ctrlKey || event.shiftKey
    const isExternal = /^https?:\/\//i.test(to)

    if (
      event.defaultPrevented
      || event.button !== 0
      || isModifiedClick
      || target === '_blank'
      || isExternal
    ) {
      return
    }

    event.preventDefault()
    navigate(to, { replace, state })
  }

  return (
    <a href={to} target={target} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
