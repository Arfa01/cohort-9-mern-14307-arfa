
import { LoaderCircle, RotateCcw } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router'

import { GuestOnlyRoute, ProtectedRoute } from './auth/RouteGuards'
import { useAuth } from './auth/useAuth'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
