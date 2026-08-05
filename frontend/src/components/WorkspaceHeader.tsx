import { NotebookPen } from 'lucide-react'
import { Link } from 'react-router'

import { useAuth } from '../auth/useAuth'
import { LogoutButton } from './LogoutButton'

export function WorkspaceHeader() {
  const { state } = useAuth()

  if (state.status !== 'authenticated') {
    return null
  }

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-brand-400 text-stone-950 shadow-sm">
            <NotebookPen aria-hidden="true" size={23} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">
              Notes App
            </span>
            <span className="block text-sm text-stone-500">
              Your personal workspace
            </span>
          </span>
        </Link>

        <div className="flex min-w-0 flex-wrap items-start gap-4 sm:items-center">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-stone-800">
              {state.user.name}
            </p>
            <p className="truncate text-sm text-stone-500">
              {state.user.email}
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
