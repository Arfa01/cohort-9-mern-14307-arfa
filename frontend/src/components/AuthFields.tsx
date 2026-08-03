// this file defines reusable form fields like text, password, etc. with labels, hints, errors 

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

const inputClassName =
  'min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-brand-700 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-100'

function FieldMessage({
  id,
  error,
  hint,
}: Pick<FieldProps, 'id' | 'error' | 'hint'>) {
  if (error !== undefined) {
    return (
      <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
        {error}
      </p>
    )
  }

  if (hint !== undefined) {
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-sm text-stone-500">
        {hint}
      </p>
    )
  }

  return null
}

export function TextField({
  id,
  label,
  error,
  hint,
  className,
  ...inputProps
}: FieldProps) {
  const describedBy =
    error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error !== undefined}
        className={`${inputClassName} ${error === undefined ? '' : 'border-red-400 focus:border-red-600 focus:ring-red-100'} ${className ?? ''}`}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

export function PasswordField({     // password field with show/hide toggle
  id,
  label,
  error,
  hint,
  className,
  ...inputProps
}: FieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const describedBy =
    error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-stone-800">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={isVisible ? 'text' : 'password'}
          aria-describedby={describedBy}
          aria-invalid={error !== undefined}
          className={`${inputClassName} pr-12 ${error === undefined ? '' : 'border-red-400 focus:border-red-600 focus:ring-red-100'} ${className ?? ''}`}
        />
        <button
          type="button"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-stone-500 transition hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-700"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" size={19} />
          ) : (
            <Eye aria-hidden="true" size={19} />
          )}
        </button>
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}
