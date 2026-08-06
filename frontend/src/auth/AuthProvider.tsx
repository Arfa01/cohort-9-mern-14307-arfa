
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type LoginRequest,
  type RegisterRequest,
} from '../api/auth.api'
import { normalizeApiError } from '../api/client'
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
} from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    error: null,
  })
  const restoreRequestId = useRef(0)

  const retrySession = useCallback(async (): Promise<void> => {
    const requestId = restoreRequestId.current + 1
    restoreRequestId.current = requestId

    setState({ status: 'loading', user: null, error: null })

    try {
      const user = await getCurrentUser()

      if (restoreRequestId.current === requestId) {
        setState({ status: 'authenticated', user, error: null })
      }
    } catch (error: unknown) {
      if (restoreRequestId.current !== requestId) {
        return
      }

      const problem = normalizeApiError(
        error,
        'Could not restore your session. Please try again.',
      )

      if (problem.status === 401) {
        setState({ status: 'unauthenticated', user: null, error: null })
        return
      }

      setState({ status: 'error', user: null, error: problem.message })
    }
  }, [])

  useEffect(() => {
    void retrySession()

    return () => {
      restoreRequestId.current += 1
    }
  }, [retrySession])

  const login = useCallback(async (input: LoginRequest): Promise<void> => {
    const user = await loginUser(input)
    restoreRequestId.current += 1
    setState({ status: 'authenticated', user, error: null })
  }, [])

  const register = useCallback(
    async (input: RegisterRequest): Promise<void> => {
      const user = await registerUser(input)
      restoreRequestId.current += 1
      setState({ status: 'authenticated', user, error: null })
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    await logoutUser()
    restoreRequestId.current += 1
    setState({ status: 'unauthenticated', user: null, error: null })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, register, logout, retrySession }),
    [state, login, register, logout, retrySession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
