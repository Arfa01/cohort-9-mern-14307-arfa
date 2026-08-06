
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { normalizeApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { PasswordField, TextField } from '../components/AuthFields'
import { AuthLayout } from '../components/AuthLayout'
import {
  registerSchema,
  type RegisterFormValues,
} from '../validation/auth.schemas'

export function RegisterPage() {
  const { register: createAccount } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  })

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await createAccount(values)
      navigate('/dashboard', { replace: true })
    } catch (caughtError: unknown) {
      const problem = normalizeApiError(
        caughtError,
        'Could not create your account. Please try again.',
      )
      let hasFieldError = false

      for (const detail of problem.details) {
        if (
          detail.field === 'name' ||
          detail.field === 'email' ||
          detail.field === 'password' ||
          detail.field === 'confirmPassword'
        ) {
          setError(detail.field, { type: 'server', message: detail.message })
          hasFieldError = true
        }
      }

      if (problem.code === 'EMAIL_ALREADY_REGISTERED') {
        setError('email', { type: 'server', message: problem.message })
        hasFieldError = true
      }

      if (!hasFieldError) {
        setError('root.server', { type: 'server', message: problem.message })
      }
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      description="Start your personal notes workspace in just a moment."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(handleRegister)(event)}
        className="space-y-4"
      >
        <TextField
          {...register('name')}
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Arfa Riaz"
          disabled={isSubmitting}
          error={errors.name?.message}
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use at least 8 characters."
          disabled={isSubmitting}
          error={errors.password?.message}
        />

        <PasswordField
          {...register('confirmPassword')}
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Enter the same password again"
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
          {isSubmitting ? null : <ArrowRight aria-hidden="true" size={18} />}
        </button>
      </form>
    </AuthLayout>
  )
}
