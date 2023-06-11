import React, { useCallback } from 'react'

import { Redirect } from './links'
import { routes } from './router'
import { useRouterState } from './router-context'

export function AuthenticatedRoute(props: any) {
  const {
    private: privateSet,
    unauthenticated,
    roles,
    whileLoadingAuth,
    children,
  } = props
  const routerState = useRouterState()
  const {
    loading: authLoading,
    isAuthenticated,
    hasRole,
  } = routerState.useAuth()

  const unauthorized = useCallback(() => {
    return !(isAuthenticated && (!roles || hasRole(roles)))
  }, [isAuthenticated, roles, hasRole])

  // Make sure `wrappers` is always an array with at least one wrapper component
  if (privateSet && unauthorized()) {
    if (!unauthenticated) {
      throw new Error(
        'Private Sets need to specify what route to redirect unauthorized ' +
          'users to by setting the `unauthenticated` prop'
      )
    }

    if (authLoading) {
      return whileLoadingAuth?.() || null
    } else {
      const currentLocation =
        globalThis.location.pathname +
        encodeURIComponent(globalThis.location.search)

      if (!routes[unauthenticated]) {
        throw new Error(`We could not find a route named ${unauthenticated}`)
      }

      let unauthenticatedPath

      try {
        unauthenticatedPath = routes[unauthenticated]()
      } catch (e) {
        if (
          e instanceof Error &&
          /Missing parameter .* for route/.test(e.message)
        ) {
          throw new Error(
            `Redirecting to route "${unauthenticated}" would require route ` +
              'parameters, which currently is not supported. Please choose ' +
              'a different route'
          )
        }

        throw new Error(
          `Could not redirect to the route named ${unauthenticated}`
        )
      }

      return (
        <Redirect to={`${unauthenticatedPath}?redirectTo=${currentLocation}`} />
      )
    }
  }

  return <>{children}</>
}
