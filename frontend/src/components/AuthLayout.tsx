// this file defines the shared layout for authentication pages (login, register)
// two colomn card, colored left side with app info, right side with form and footer. background shapes blurred. responsive mobile layout

import { LockKeyhole, NotebookPen, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-5 py-10 sm:px-8">
      <div
        aria-hidden="true"
        className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-200/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-100/80 blur-3xl"
      />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white shadow-[0_30px_80px_-35px_rgba(107,70,0,0.25)] md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative hidden min-h-[650px] overflow-hidden bg-brand-100 p-10 text-stone-950 md:flex md:flex-col md:justify-between">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[36px] border-stone-950/10"
          />

          <div className="relative flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-400 text-stone-950 shadow-sm">
              <NotebookPen aria-hidden="true" size={23} />
            </span>
            <span className="text-xl font-semibold tracking-tight">Notes App</span>
          </div>

          <div className="relative space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/60 px-3 py-1.5 text-sm text-stone-800">
              <Sparkles aria-hidden="true" size={15} />
              Your thoughts, in one calm place
            </span>
            <div>
              <p className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
                Capture what matters. Return whenever inspiration strikes.
              </p>
              <p className="mt-4 max-w-sm text-base leading-7 text-stone-700">
                Sign in to reach your personal notes workspace from any session.
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2 text-sm text-stone-700">
            <LockKeyhole aria-hidden="true" size={16} />
            Secured with an HTTP-only session cookie
          </div>
        </div>

        <div className="flex min-h-[650px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="mb-9 flex items-center gap-3 md:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-400 text-stone-950">
              <NotebookPen aria-hidden="true" size={21} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-stone-950">
              Notes App
            </span>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-800">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-md leading-7 text-stone-600">{description}</p>
          </div>

          {children}

          <div className="mt-8 text-center text-sm text-stone-600">{footer}</div>
        </div>
      </section>
    </main>
  )
}
