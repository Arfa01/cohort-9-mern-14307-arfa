
import { createContext } from 'react'

import type {
  LoginRequest,
  RegisterRequest,
  User,
} from '../api/auth.api'

export type AuthState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'authenticated'; user: User; error: null }
  | { status: 'unauthenticated'; user: null; error: null }
  | { status: 'error'; user: null; error: string }

export interface AuthContextValue {
  state: AuthState
  login: (input: LoginRequest) => Promise<void>
  register: (input: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  retrySession: () => Promise<void>
  invalidateSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
