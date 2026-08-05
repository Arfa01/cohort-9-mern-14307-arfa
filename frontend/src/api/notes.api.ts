import { apiClient } from './client'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteRequest {
  title: string
  content: string
}

export type UpdateNoteRequest = Partial<CreateNoteRequest>

interface NoteResponse {
  success: true
  data: {
    note: Note
  }
}

interface NotesResponse {
  success: true
  data: {
    notes: Note[]
  }
}

export async function listNotes(signal?: AbortSignal): Promise<Note[]> {
  const response = await apiClient.get<NotesResponse>('/notes', { signal })
  return response.data.data.notes
}

export async function getNote(
  noteId: string,
  signal?: AbortSignal,
): Promise<Note> {
  const response = await apiClient.get<NoteResponse>(
    `/notes/${encodeURIComponent(noteId)}`,
    { signal },
  )

  return response.data.data.note
}

export async function createNote(input: CreateNoteRequest): Promise<Note> {
  const response = await apiClient.post<NoteResponse>('/notes', input)
  return response.data.data.note
}

export async function updateNote(
  noteId: string,
  input: UpdateNoteRequest,
): Promise<Note> {
  const response = await apiClient.patch<NoteResponse>(
    `/notes/${encodeURIComponent(noteId)}`,
    input,
  )

  return response.data.data.note
}

export async function deleteNote(noteId: string): Promise<void> {
  await apiClient.delete(`/notes/${encodeURIComponent(noteId)}`)
}
