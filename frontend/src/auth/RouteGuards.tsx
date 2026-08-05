
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const { state } = useAuth()

  if (state.status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
