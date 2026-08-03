// this file defines the shared authentication contract and its four states

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
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// typescript prevents "authenticated but useris null" errors by using a union type for the four states of authentication. The AuthContextValue interface defines the shape of the context value, including the current state and functions for login, register, logout, and retrying the session.