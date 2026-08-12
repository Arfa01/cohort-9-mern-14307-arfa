import { FileText, LoaderCircle, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

import type { Note } from '../api/notes.api'
import { getNotePlainText } from '../utils/note-content'

interface NoteCardProps {
  note: Note
  isConfirmingDelete: boolean
  isDeleting: boolean
  actionsDisabled: boolean
  deleteError: string | null
  onAskToDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

function formatUpdatedDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? 'Recently updated' : dateFormatter.format(date)
}

export function NoteCard({
  note,
  isConfirmingDelete,
  isDeleting,
  actionsDisabled,
  deleteError,
  onAskToDelete,
  onCancelDelete,
  onConfirmDelete,
}: NoteCardProps) {
  const plainTextPreview = getNotePlainText(note.content)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const wasConfirmingDelete = useRef(false)

  useEffect(() => {
    if (isConfirmingDelete) {
      cancelButtonRef.current?.focus()
    } else if (wasConfirmingDelete.current) {
      deleteButtonRef.current?.focus()
    }

    wasConfirmingDelete.current = isConfirmingDelete
  }, [isConfirmingDelete])

  return (
    <article className="flex min-h-64 flex-col rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60">
      <span className="grid size-11 place-items-center rounded-xl bg-brand-100 text-brand-800">
        <FileText aria-hidden="true" size={21} />
      </span>
      <h3 className="mt-5 line-clamp-2 text-xl font-semibold tracking-tight">
        {note.title}
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-stone-600">
        {plainTextPreview || 'No content yet.'}
      </p>
      <p className="mt-5 text-xs font-medium uppercase tracking-[0.11em] text-stone-400">
        Updated{' '}
        <time dateTime={note.updatedAt}>{formatUpdatedDate(note.updatedAt)}</time>
      </p>

      {isConfirmingDelete ? (
        <div
          role="group"
          aria-label={`Delete ${note.title} confirmation`}
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3"
        >
          <p className="text-sm font-semibold text-red-900">
            Delete this note permanently?
          </p>
          {deleteError === null ? null : (
            <p role="alert" className="mt-2 text-sm text-red-800">
              {deleteError}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              ref={cancelButtonRef}
              type="button"
              disabled={isDeleting}
              onClick={onCancelDelete}
              className="min-h-10 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirmDelete}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
            >
              {isDeleting ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
              ) : (
                <Trash2 aria-hidden="true" size={16} />
              )}
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex gap-2 border-t border-stone-100 pt-4">
          <Link
            to={`/notes/${encodeURIComponent(note.id)}/edit`}
            aria-label={`Edit ${note.title}`}
            aria-disabled={actionsDisabled}
            tabIndex={actionsDisabled ? -1 : undefined}
            onClick={(event) => {
              if (actionsDisabled) {
                event.preventDefault()
              }
            }}
            className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-brand-100 px-3 py-2 text-sm font-semibold text-brand-800 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
              actionsDisabled
                ? 'pointer-events-none opacity-50'
                : 'hover:bg-brand-200'
            }`}
          >
            Edit
          </Link>
          <button
            ref={deleteButtonRef}
            type="button"
            aria-label={`Delete ${note.title}`}
            disabled={actionsDisabled}
            onClick={onAskToDelete}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 aria-hidden="true" size={16} />
            Delete
          </button>
        </div>
      )}
    </article>
  )
}
