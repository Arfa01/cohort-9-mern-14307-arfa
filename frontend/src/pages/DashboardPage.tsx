import {
  LoaderCircle,
  PenLine,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { normalizeApiError } from '../api/client'
import { deleteNote, listNotes, type Note } from '../api/notes.api'
import { useAuth } from '../auth/useAuth'
import { NoteCard } from '../components/NoteCard'
import { WorkspaceHeader } from '../components/WorkspaceHeader'

type NotesState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string }

export function DashboardPage() {
  const { state, invalidateSession } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [notesState, setNotesState] = useState<NotesState>({ status: 'loading' })
  const [deleteCandidate, setDeleteCandidate] = useState<Note | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const notesHeading = useRef<HTMLHeadingElement>(null)

  const loadUserNotes = useCallback(async (): Promise<void> => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setNotesState({ status: 'loading' })

    try {
      const loadedNotes = await listNotes(controller.signal)

      if (!controller.signal.aborted) {
        setNotes(loadedNotes)
        setNotesState({ status: 'ready' })
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        return
      }

      const problem = normalizeApiError(
        error,
        'Could not load your notes. Please try again.',
      )

      if (problem.status === 401) {
        invalidateSession()
        return
      }

      setNotesState({ status: 'error', message: problem.message })
    }
  }, [invalidateSession])

  useEffect(() => {
    void loadUserNotes()

    return () => activeRequest.current?.abort()
  }, [loadUserNotes])

  if (state.status !== 'authenticated') {
    return null
  }

  const firstName = state.user.name.trim().split(/\s+/)[0] || state.user.name

  const askToDelete = (note: Note) => {
    setDeleteCandidate(note)
    setDeleteError(null)
    setWorkspaceMessage(null)
  }

  const cancelDelete = () => {
    if (isDeleting) {
      return
    }

    setDeleteCandidate(null)
    setDeleteError(null)
  }

  const confirmDelete = async (): Promise<void> => {
    if (deleteCandidate === null || isDeleting) {
      return
    }

    const noteToDelete = deleteCandidate

    setIsDeleting(true)
    setDeleteError(null)
    setWorkspaceMessage(null)

    try {
      await deleteNote(noteToDelete.id)
      setNotes((currentNotes) =>
        currentNotes.filter((note) => note.id !== noteToDelete.id),
      )
      setDeleteCandidate(null)
      setWorkspaceMessage('Note deleted.')
      notesHeading.current?.focus()
    } catch (error: unknown) {
      const problem = normalizeApiError(
        error,
        'Could not delete this note. Please try again.',
      )

      if (problem.status === 401) {
        invalidateSession()
        return
      }

      if (problem.code === 'NOTE_NOT_FOUND') {
        setNotes((currentNotes) =>
          currentNotes.filter((note) => note.id !== noteToDelete.id),
        )
        setDeleteCandidate(null)
        setWorkspaceMessage('That note had already been removed.')
        notesHeading.current?.focus()
        return
      }

      setDeleteError(problem.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <WorkspaceHeader />

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="overflow-hidden rounded-[2rem] border border-brand-200 bg-brand-100 p-7 text-stone-950 shadow-xl shadow-brand-100 sm:p-10">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.17em] text-brand-800">
                Personal workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome, {firstName}.
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-stone-700">
                Keep ideas, plans, and snippets together in notes only you can access.
              </p>
            </div>
            <Link
              to="/notes/new"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-950"
            >
              <Plus aria-hidden="true" size={20} />
              New note
            </Link>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="your-notes-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-500">
                Library
              </p>
              <h2
                ref={notesHeading}
                id="your-notes-heading"
                tabIndex={-1}
                className="mt-1 text-2xl font-semibold tracking-tight outline-none"
              >
                Your notes
              </h2>
            </div>
            {notesState.status === 'ready' && notes.length > 0 ? (
              <p className="text-sm text-stone-500">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </p>
            ) : null}
          </div>

          {workspaceMessage === null ? null : (
            <p
              role="status"
              className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {workspaceMessage}
            </p>
          )}

          {notesState.status === 'loading' ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 grid min-h-64 place-items-center rounded-[2rem] border border-stone-200 bg-white p-8 text-center"
            >
              <div>
                <LoaderCircle
                  aria-hidden="true"
                  className="mx-auto animate-spin text-brand-700"
                  size={32}
                />
                <p className="mt-4 font-semibold">Loading your notes…</p>
              </div>
            </div>
          ) : null}

          {notesState.status === 'error' ? (
            <div className="mt-6 rounded-[2rem] border border-red-200 bg-white p-8 text-center">
              <RotateCcw aria-hidden="true" className="mx-auto text-red-600" size={34} />
              <h3 className="mt-4 text-xl font-semibold">Your notes could not load</h3>
              <p role="alert" className="mt-2 text-stone-600">
                {notesState.message}
              </p>
              <button
                type="button"
                onClick={() => void loadUserNotes()}
                className="mt-5 min-h-11 rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                Try again
              </button>
            </div>
          ) : null}

          {notesState.status === 'ready' && notes.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center sm:p-12">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <PenLine aria-hidden="true" size={26} />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">No notes yet</h3>
              <p className="mx-auto mt-2 max-w-md leading-7 text-stone-600">
                Create your first note and use rich-text formatting to make it easy to scan.
              </p>
              <Link
                to="/notes/new"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <Plus aria-hidden="true" size={18} />
                Create first note
              </Link>
            </div>
          ) : null}

          {notesState.status === 'ready' && notes.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => {
                const confirmingThisNote = deleteCandidate?.id === note.id

                return (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isConfirmingDelete={confirmingThisNote}
                    isDeleting={confirmingThisNote && isDeleting}
                    actionsDisabled={deleteCandidate !== null}
                    deleteError={confirmingThisNote ? deleteError : null}
                    onAskToDelete={() => askToDelete(note)}
                    onCancelDelete={cancelDelete}
                    onConfirmDelete={() => void confirmDelete()}
                  />
                )
              })}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
