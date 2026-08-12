import {
  LoaderCircle,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router'

import { normalizeApiError } from '../api/client'
import { deleteNote, listNotes, type Note } from '../api/notes.api'
import { useAuth } from '../auth/useAuth'
import { NoteCard } from '../components/NoteCard'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { getNotePlainText } from '../utils/note-content'

type NotesState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string }

type NotesSort = 'updated-desc' | 'updated-asc' | 'title-asc'

const titleCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getUpdatedTimestamp(value: string): number | null {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

function compareUpdatedAt(
  left: Note,
  right: Note,
  direction: 'ascending' | 'descending',
): number {
  const leftTime = getUpdatedTimestamp(left.updatedAt)
  const rightTime = getUpdatedTimestamp(right.updatedAt)

  if (leftTime === null) {
    return rightTime === null ? 0 : 1
  }

  if (rightTime === null) {
    return -1
  }

  return direction === 'descending'
    ? rightTime - leftTime
    : leftTime - rightTime
}

function compareNotes(left: Note, right: Note, sort: NotesSort): number {
  if (sort === 'title-asc') {
    return titleCollator.compare(left.title, right.title)
  }

  return compareUpdatedAt(
    left,
    right,
    sort === 'updated-desc' ? 'descending' : 'ascending',
  )
}

export function DashboardPage(): JSX.Element | null {
  const { state, invalidateSession } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [notesState, setNotesState] = useState<NotesState>({ status: 'loading' })
  const [searchQuery, setSearchQuery] = useState('')
  const [notesSort, setNotesSort] = useState<NotesSort>('updated-desc')
  const [deleteCandidate, setDeleteCandidate] = useState<Note | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const notesHeading = useRef<HTMLHeadingElement>(null)

  const normalizedSearchQuery = normalizeSearchText(searchQuery)

  const visibleNotes = useMemo(
    () =>
      notes
        .map((note, originalIndex) => ({ note, originalIndex }))
        .filter(({ note }) => {
          if (normalizedSearchQuery.length === 0) {
            return true
          }

          return (
            normalizeSearchText(note.title).includes(normalizedSearchQuery) ||
            normalizeSearchText(getNotePlainText(note.content)).includes(
              normalizedSearchQuery,
            )
          )
        })
        .sort((left, right) => {
          const comparison = compareNotes(left.note, right.note, notesSort)

          return comparison === 0
            ? left.originalIndex - right.originalIndex
            : comparison
        })
        .map(({ note }) => note),
    [normalizedSearchQuery, notes, notesSort],
  )
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
              <p
                aria-live="polite"
                aria-atomic="true"
                className="text-sm text-stone-500"
              >
                {normalizedSearchQuery.length > 0
                  ? `Showing ${visibleNotes.length} of ${notes.length} ${
                      notes.length === 1 ? 'note' : 'notes'
                    }`
                  : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
              </p>
            ) : null}
          </div>

          {notesState.status === 'ready' && notes.length > 0 ? (
            <div className="mt-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
              <div>
                <label
                  htmlFor="notes-search"
                  className="mb-2 block text-sm font-semibold text-stone-700"
                >
                  Search notes
                </label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search
                      aria-hidden="true"
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      id="notes-search"
                      type="search"
                      value={searchQuery}
                      disabled={deleteCandidate !== null}
                      aria-controls="notes-results"
                      placeholder="Search by title or content"
                      onChange={(event) => setSearchQuery(event.currentTarget.value)}
                      className="min-h-11 w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-stone-100"
                    />
                  </div>

                  {searchQuery.length > 0 ? (
                    <button
                      type="button"
                      aria-label="Clear note search"
                      disabled={deleteCandidate !== null}
                      onClick={() => setSearchQuery('')}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X aria-hidden="true" size={17} />
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes-sort"
                  className="mb-2 block text-sm font-semibold text-stone-700"
                >
                  Sort notes
                </label>
                <select
                  id="notes-sort"
                  value={notesSort}
                  disabled={deleteCandidate !== null}
                  aria-controls="notes-results"
                  onChange={(event) =>
                    setNotesSort(event.currentTarget.value as NotesSort)
                  }
                  className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-stone-100"
                >
                  <option value="updated-desc">Recently updated</option>
                  <option value="updated-asc">Oldest updated</option>
                  <option value="title-asc">Title A–Z</option>
                </select>
              </div>
            </div>
          ) : null}

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

          {notesState.status === 'ready' && notes.length > 0 && visibleNotes.length === 0 ? (
            <div
              id="notes-results"
              className="mt-6 rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center sm:p-12"
            >
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-800">
                <Search aria-hidden="true" size={25} />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                No matching notes
              </h3>
              <p className="mx-auto mt-2 max-w-md leading-7 text-stone-600">
                Try another word or show all of your notes again.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-6 min-h-11 rounded-xl bg-brand-400 px-5 py-2.5 font-semibold text-stone-950 transition hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                Show all notes
              </button>
            </div>
          ) : null}
          {notesState.status === 'ready' && visibleNotes.length > 0 ? (
            <div
              id="notes-results"
              className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {visibleNotes.map((note) => {
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
