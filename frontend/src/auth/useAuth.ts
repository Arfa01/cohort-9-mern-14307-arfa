// this file a safe way/hook to access authProvider. 


import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from './auth-context'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {   // if accidentally used outside of AuthProvider, throw error
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
