
import { LoaderCircle, RotateCcw } from 'lucide-react'
import { Component, lazy, Suspense } from 'react'
import type { ErrorInfo, JSX, ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'

import { GuestOnlyRoute, ProtectedRoute } from './auth/RouteGuards'
import { useAuth } from './auth/useAuth'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

const NoteEditorPage = lazy(async () => {
  const module = await import('./pages/NoteEditorPage')
  return { default: module.NoteEditorPage }
})

interface ChunkErrorBoundaryProps {
  children: ReactNode
}

interface ChunkErrorBoundaryState {
  failed: boolean
}

class ChunkErrorBoundary extends Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  state: ChunkErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ChunkErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Editor route failed to load', error, info)
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <main className="grid min-h-screen place-items-center bg-stone-50 px-5">
          <section
            role="alert"
            className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-200/50"
          >
            <h1 className="text-2xl font-semibold text-stone-900">
              The editor could not load
            </h1>
            <p className="mt-3 text-stone-600">
              Reload the page to try downloading it again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 min-h-11 rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              Reload page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

function NoteEditorRoute(): JSX.Element {
    return (
  <ChunkErrorBoundary>
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-stone-50 px-5">
          <div role="status" aria-live="polite" className="text-center">
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto animate-spin text-brand-700"
              size={32}
            />
            <p className="mt-4 font-semibold text-stone-900">Opening the editor…</p>
          </div>
        </main>
      }
    >
      <NoteEditorPage />
    </Suspense>
  </ChunkErrorBoundary>
  )
}

function App() {
  const { state, retrySession } = useAuth()

  if (state.status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 px-5">
        <div role="status" aria-live="polite" className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-400 text-stone-950 shadow-lg shadow-brand-200">
            <LoaderCircle aria-hidden="true" className="animate-spin" size={27} />
          </span>
          <p className="mt-5 font-semibold text-stone-900">Opening your workspace…</p>
          <p className="mt-1 text-sm text-stone-500">Checking your session</p>
        </div>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 px-5">
        <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-200/50">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <RotateCcw aria-hidden="true" size={25} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            We could not reach your workspace
          </h1>
          <p role="alert" className="mt-3 leading-7 text-stone-600">
            {state.error}
          </p>
          <button
            type="button"
            onClick={() => void retrySession()}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Try again
          </button>
        </section>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/notes/new" element={<NoteEditorRoute />} />
        <Route path="/notes/:noteId/edit" element={<NoteEditorRoute />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
