// this file defines the dashboard page, which is shown after login. It shows a welcome banner and some info about the app. It also has a logout button.

import { CircleCheck, NotebookPen, PenLine, ShieldCheck } from 'lucide-react'

import { useAuth } from '../auth/useAuth'
import { LogoutButton } from '../components/LogoutButton'

export function DashboardPage() {
  const { state } = useAuth()

  if (state.status !== 'authenticated') {
    return null
  }

  const firstName = state.user.name.trim().split(/\s+/)[0] || state.user.name

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-400 text-stone-950 shadow-sm">
              <NotebookPen aria-hidden="true" size={23} />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">Notes App</p>
              <p className="text-sm text-stone-500">Your personal workspace</p>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-4 sm:items-center">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-stone-800">
                {state.user.name}
              </p>
              <p className="truncate text-sm text-stone-500">{state.user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-brand-200 bg-brand-100 p-7 text-stone-950 shadow-xl shadow-brand-100 sm:p-10">
          <div className="flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:items-center">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/60">
              <CircleCheck aria-hidden="true" size={28} />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.17em] text-brand-800">
                Account ready
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome, {firstName}.
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-stone-700">
                You are signed in securely. Your session will be restored when you refresh this page.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.42fr]">
          <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center sm:p-12">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <PenLine aria-hidden="true" size={26} />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight">
              Your notes workspace will appear here
            </h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-stone-600">
              Note creation, editing, and the required rich-text editor belong to the next feature.
            </p>
          </div>

          <aside className="rounded-[2rem] border border-stone-200 bg-white p-7">
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck aria-hidden="true" size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">Session protected</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              The browser sends your HTTP-only cookie automatically. The React app never reads or stores the JWT.
            </p>
          </aside>
        </section>
      </main>
    </div>
  )
}
