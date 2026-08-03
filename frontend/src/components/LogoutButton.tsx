// this file calls logout, disables the button while waiting for response, gives error if can't reach backend. 


import { LogOut } from 'lucide-react'
import { useState } from 'react'

import { normalizeApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'

export function LogoutButton() {
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError(null)

    try {
      await logout()
    } catch (caughtError: unknown) {
      setError(
        normalizeApiError(
          caughtError,
          'Could not log you out. Please try again.',
        ).message,
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={isLoggingOut}
        onClick={() => void handleLogout()}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut aria-hidden="true" size={17} />
        {isLoggingOut ? 'Logging out…' : 'Log out'}
      </button>
      {error === null ? null : (
        <p role="alert" className="max-w-64 text-right text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
