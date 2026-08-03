// this file defines route guards for frontend authentication.

import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './useAuth'

export function ProtectedRoute() {  // keeps signed out users away from protected routes like dashboard
  const { state } = useAuth()
  const location = useLocation()

  if (state.status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} /> // remember where the user was trying to go so we can redirect them back after login
  }

  return <Outlet />
}

export function GuestOnlyRoute() {   // keeps signed in users away from guest only routes like login and register
  const { state } = useAuth()

  if (state.status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
