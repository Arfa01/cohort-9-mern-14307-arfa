import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, FileQuestion, LoaderCircle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import type { JSX } from 'react'
import { normalizeApiError } from '../api/client'
import { createNote, getNote, updateNote } from '../api/notes.api'
import { useAuth } from '../auth/useAuth'
import { RichTextEditor } from '../components/RichTextEditor'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import {
  noteFormSchema,
  type NoteFormValues,
} from '../validation/note.schemas'

type LoadState =
  | { status: 'ready' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }

export function NoteEditorPage(): JSX.Element {
  const { noteId } = useParams<{ noteId: string }>()
  const isEditing = noteId !== undefined
  const navigate = useNavigate()
  const { invalidateSession } = useAuth()
  const [loadState, setLoadState] = useState<LoadState>(
    isEditing ? { status: 'loading' } : { status: 'ready' },
  )
  const [reloadKey, setReloadKey] = useState(0)
  const [requestError, setRequestError] = useState<string | null>(null)

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  })

  useEffect(() => {
    if (noteId === undefined) {
      reset({ title: '', content: '' })
      setLoadState({ status: 'ready' })
      setRequestError(null)
      return
    }

    const controller = new AbortController()
    setLoadState({ status: 'loading' })
    setRequestError(null)

    void getNote(noteId, controller.signal)
      .then((note) => {
        if (controller.signal.aborted) {
          return
        }

        reset({
          title: note.title,
          content: note.content,
        })
        setLoadState({ status: 'ready' })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const problem = normalizeApiError(
          error,
          'Could not load this note. Please try again.',
        )

        if (problem.status === 401) {
          invalidateSession()
          return
        }

        if (problem.code === 'NOTE_NOT_FOUND') {
          setLoadState({ status: 'not-found' })
          return
        }

        setLoadState({ status: 'error', message: problem.message })
      })

    return () => controller.abort()
  }, [invalidateSession, noteId, reloadKey, reset])

  const saveNote = handleSubmit(async (values) => {
    setRequestError(null)

    try {
      if (noteId === undefined) {
        await createNote(values)
      } else {
        await updateNote(noteId, values)
      }

      navigate('/dashboard', { replace: true })
    } catch (error: unknown) {
      const problem = normalizeApiError(
        error,
        isEditing
          ? 'Could not save your changes. Please try again.'
          : 'Could not create your note. Please try again.',
      )

      if (problem.status === 401) {
        invalidateSession()
        return
      }

      let mappedFieldError = false

      for (const detail of problem.details) {
        if (detail.field === 'title' || detail.field === 'content') {
          setError(detail.field, {
            type: 'server',
            message: detail.message,
          })
          mappedFieldError = true
        }
      }

      if (!mappedFieldError) {
        setRequestError(problem.message)
      }
    }
  })

  const titleLength = watch('title').length

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <WorkspaceHeader />

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Back to notes
        </Link>

        {loadState.status === 'loading' ? (
          <section
            role="status"
            aria-live="polite"
            className="mt-6 grid min-h-96 place-items-center rounded-[2rem] border border-stone-200 bg-white p-8 text-center"
          >
            <div>
              <LoaderCircle
                aria-hidden="true"
                className="mx-auto animate-spin text-brand-700"
                size={34}
              />
              <p className="mt-4 font-semibold">Loading your note…</p>
            </div>
          </section>
        ) : null}

        {loadState.status === 'error' ? (
          <section className="mt-6 rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">This note could not load</h1>
            <p role="alert" className="mt-3 text-stone-600">
              {loadState.message}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="mt-6 min-h-11 rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              Try again
            </button>
          </section>
        ) : null}

        {loadState.status === 'not-found' ? (
          <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <FileQuestion
              aria-hidden="true"
              className="mx-auto text-amber-600"
              size={42}
            />
            <h1 className="mt-5 text-2xl font-semibold">Note not found</h1>
            <p role="alert" className="mt-3 text-stone-600">
              It may have been deleted, or you may no longer have access to it.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              Return to notes
            </Link>
          </section>
        ) : null}

        {loadState.status === 'ready' ? (
          <form
            noValidate
            onSubmit={(event) => void saveNote(event)}
            className="mt-6 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-200/50"
          >
            <div className="border-b border-stone-200 bg-brand-100 px-6 py-7 sm:px-9">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-800">
                {isEditing ? 'Edit note' : 'New note'}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {isEditing ? 'Shape your thoughts' : 'Capture something worth keeping'}
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-stone-700">
                Use the formatting toolbar for headings, emphasis, lists, quotes, and code.
              </p>
            </div>

            <div className="space-y-7 p-6 sm:p-9">
              <div>
                <div className="flex items-end justify-between gap-4">
                  <label htmlFor="note-title" className="font-semibold text-stone-800">
                    Title
                  </label>
                  <span className="text-xs text-stone-500">
                    {titleLength}/120
                  </span>
                </div>
                <input
                  id="note-title"
                  type="text"
                  maxLength={120}
                  autoComplete="off"
                  aria-invalid={errors.title === undefined ? 'false' : 'true'}
                  aria-describedby="note-title-error"
                  disabled={isSubmitting}
                  {...register('title')}
                  className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg font-semibold outline-none transition placeholder:font-normal placeholder:text-stone-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-100"
                  placeholder="Give your note a clear title"
                />
                <p id="note-title-error" className="mt-2 min-h-5 text-sm text-red-700">
                  {errors.title?.message}
                </p>
              </div>

              <div>
                <p className="font-semibold text-stone-800">Content</p>
                <div className="mt-2">
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        invalid={errors.content !== undefined}
                        focusOnInvalid={
                          errors.title === undefined && errors.content !== undefined
                        }
                        ariaDescribedBy="note-content-error"
                      />
                    )}
                  />
                </div>
                <p id="note-content-error" className="mt-2 min-h-5 text-sm text-red-700">
                  {errors.content?.message}
                </p>
              </div>

              {requestError === null ? null : (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {requestError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => navigate('/dashboard')}
                  className="min-h-11 rounded-xl border border-stone-300 bg-white px-5 py-2.5 font-semibold text-stone-700 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 shadow-sm transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
                  ) : (
                    <Save aria-hidden="true" size={18} />
                  )}
                  {isSubmitting
                    ? 'Saving…'
                    : isEditing
                      ? 'Save changes'
                      : 'Create note'}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </main>
    </div>
  )
}
