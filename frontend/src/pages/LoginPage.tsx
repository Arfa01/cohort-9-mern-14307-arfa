
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'

import { normalizeApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { PasswordField, TextField } from '../components/AuthFields'
import { AuthLayout } from '../components/AuthLayout'
import {
  loginSchema,
  type LoginFormInput,
  type LoginFormValues,
} from '../validation/auth.schemas'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  const handleLogin = async (values: LoginFormValues) => {
    try {
      await login(values)
      const from =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string' &&
        location.state.from.startsWith('/') &&
        !location.state.from.startsWith('//')
          ? location.state.from
          : '/dashboard'
      navigate(from, { replace: true })
    } catch (caughtError: unknown) {
      const problem = normalizeApiError(
        caughtError,
        'Could not sign you in. Please try again.',
      )
      let hasFieldError = false

      for (const detail of problem.details) {
        if (detail.field === 'email' || detail.field === 'password') {
          setError(detail.field, { type: 'server', message: detail.message })
          hasFieldError = true
        }
      }

      if (!hasFieldError) {
        setError('root.server', { type: 'server', message: problem.message })
      }
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your notes"
      description="Enter your details to continue to your personal workspace."
      footer={
        <>
          New to Notes App?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(handleLogin)(event)}
        className="space-y-5"
      >
        <TextField
          {...register('email')}
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          error={errors.email?.message}
        />

        <PasswordField
          {...register('password')}
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={isSubmitting}
          error={errors.password?.message}
        />

        {errors.root?.server?.message === undefined ? null : (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {errors.root.server.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-3 font-semibold text-stone-950 shadow-lg shadow-brand-200 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
          {isSubmitting ? null : <ArrowRight aria-hidden="true" size={18} />}
        </button>
      </form>
    </AuthLayout>
  )
}
