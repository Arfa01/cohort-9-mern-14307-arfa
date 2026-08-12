import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import App from '../App'
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type User,
} from '../api/auth.api'
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
  type Note,
} from '../api/notes.api'
import { AuthProvider } from '../auth/AuthProvider'

jest.mock('../api/auth.api', () => ({
  getCurrentUser: jest.fn(),
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  logoutUser: jest.fn(),
}))

jest.mock('../api/notes.api', () => ({
  listNotes: jest.fn(),
  getNote: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}))

jest.mock('../components/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    disabled,
    invalid,
    ariaDescribedBy,
  }: {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    invalid?: boolean
    focusOnInvalid?: boolean
    ariaDescribedBy: string
  }) => (
    <textarea
      aria-label="Note content"
      aria-describedby={ariaDescribedBy}
      aria-invalid={invalid ? 'true' : 'false'}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

const { RichTextEditor: ActualRichTextEditor } = jest.requireActual<
  typeof import('../components/RichTextEditor')
>('../components/RichTextEditor')

const mockedGetCurrentUser = jest.mocked(getCurrentUser)
const mockedLoginUser = jest.mocked(loginUser)
const mockedRegisterUser = jest.mocked(registerUser)
const mockedLogoutUser = jest.mocked(logoutUser)
const mockedListNotes = jest.mocked(listNotes)
const mockedGetNote = jest.mocked(getNote)
const mockedCreateNote = jest.mocked(createNote)
const mockedUpdateNote = jest.mocked(updateNote)
const mockedDeleteNote = jest.mocked(deleteNote)

const USER: User = {
  id: '507f1f77bcf86cd799439011',
  name: 'Arfa Riaz',
  email: 'arfa@example.com',
}

const NOTE: Note = {
  id: '507f1f77bcf86cd799439012',
  title: 'Launch plan',
  content:
    '<h2>Week one</h2><p>Hello <strong>world</strong></p><script>alert(1)</script>',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-05T11:30:00.000Z',
}

const networkError = { isAxiosError: true }

function responseError(
  status: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>,
) {
  return {
    isAxiosError: true,
    response: {
      status,
      data: {
        success: false,
        error: { code, message, details },
      },
    },
  }
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('notes workspace', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedGetCurrentUser.mockResolvedValue(USER)
    mockedLoginUser.mockResolvedValue(USER)
    mockedRegisterUser.mockResolvedValue(USER)
    mockedLogoutUser.mockResolvedValue()
    mockedListNotes.mockResolvedValue([])
  })

  it('keeps server order for equal update times and renders only a plain-text preview', async () => {
    const olderNote: Note = {
      ...NOTE,
      id: '507f1f77bcf86cd799439013',
      title: 'Retro notes',
      content: '<p>Older</p>',
    }

    mockedListNotes.mockResolvedValue([NOTE, olderNote])

    renderApp('/dashboard')

    const noteHeadings = await screen.findAllByRole('heading', { level: 3 })

    expect(noteHeadings.map((heading) => heading.textContent)).toEqual([
      'Launch plan',
      'Retro notes',
    ])

    expect(
      await screen.findByRole('heading', { name: 'Launch plan' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Week one Hello world')).toBeInTheDocument()
    expect(screen.queryByText('alert(1)')).not.toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })

  it('searches titles and visible rich-text content without indexing scripts', async () => {
    const user = userEvent.setup()
    const contentNote: Note = {
      ...NOTE,
      id: '507f1f77bcf86cd799439013',
      title: 'Retro notes',
      content:
        '<p>Review the quarterly budget</p><script>hidden launch token</script>',
      updatedAt: '2026-08-04T09:00:00.000Z',
    }

    mockedListNotes.mockResolvedValue([NOTE, contentNote])

    renderApp('/dashboard')

    const searchInput = await screen.findByRole('searchbox', {
      name: 'Search notes',
    })

    await user.type(searchInput, 'lAuNcH')

    expect(
      screen.getByRole('heading', { name: 'Launch plan' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Retro notes' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 2 notes')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Clear note search' }),
    )

    expect(searchInput).toHaveValue('')
    expect(
      screen.getByRole('heading', { name: 'Retro notes' }),
    ).toBeInTheDocument()

    await user.type(searchInput, 'QUARTERLY BUDGET')

    expect(
      screen.getByRole('heading', { name: 'Retro notes' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Launch plan' }),
    ).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, 'alert(1)')

    expect(
      screen.getByRole('heading', { name: 'No matching notes' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Showing 0 of 2 notes')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Show all notes' }),
    )

    expect(searchInput).toHaveValue('')
    expect(
      screen.getByRole('heading', { name: 'Launch plan' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Retro notes' }),
    ).toBeInTheDocument()
  })

  it('sorts notes by update time and title while keeping invalid dates last', async () => {
    const user = userEvent.setup()
    const oldestNote: Note = {
      ...NOTE,
      id: '507f1f77bcf86cd799439013',
      title: 'Zebra 10',
      updatedAt: '2026-08-01T09:00:00.000Z',
    }
    const invalidDateNote: Note = {
      ...NOTE,
      id: '507f1f77bcf86cd799439014',
      title: 'Beta 1',
      updatedAt: 'not-a-date',
    }
    const newestNote: Note = {
      ...NOTE,
      id: '507f1f77bcf86cd799439015',
      title: 'Alpha 2',
      updatedAt: '2026-08-09T09:00:00.000Z',
    }

    mockedListNotes.mockResolvedValue([
      oldestNote,
      invalidDateNote,
      newestNote,
    ])

    renderApp('/dashboard')

    await screen.findByRole('heading', { name: 'Alpha 2' })

    const getNoteTitles = () =>
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)

    expect(getNoteTitles()).toEqual(['Alpha 2', 'Zebra 10', 'Beta 1'])

    const sortSelect = screen.getByRole('combobox', {
      name: 'Sort notes',
    })

    await user.selectOptions(sortSelect, 'updated-asc')

    expect(getNoteTitles()).toEqual(['Zebra 10', 'Alpha 2', 'Beta 1'])

    await user.selectOptions(sortSelect, 'title-asc')

    expect(getNoteTitles()).toEqual(['Alpha 2', 'Beta 1', 'Zebra 10'])
  })

  it('validates and creates a note with the exact rich-text payload', async () => {
    const user = userEvent.setup()
    const createdNote: Note = {
      ...NOTE,
      title: 'Project outline',
      content: '<h2>Milestone</h2><p>Finish the editor.</p>',
    }
    mockedCreateNote.mockResolvedValue(createdNote)

    renderApp('/notes/new')

    await screen.findByRole('heading', {
      name: 'Capture something worth keeping',
    })
    await user.click(screen.getByRole('button', { name: 'Create note' }))

    expect(await screen.findByText('Title is required.')).toBeInTheDocument()
    expect(mockedCreateNote).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Title'), ' Project outline ')
    await user.type(
      screen.getByLabelText('Note content'),
      '<h2>Milestone</h2><p>Finish the editor.</p>',
    )
    await user.click(screen.getByRole('button', { name: 'Create note' }))

    await waitFor(() => {
      expect(mockedCreateNote).toHaveBeenCalledWith({
        title: 'Project outline',
        content: '<h2>Milestone</h2><p>Finish the editor.</p>',
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Welcome, Arfa.' }),
    ).toBeInTheDocument()
  })

  it('loads the canonical note and sends the exact edit payload', async () => {
    const user = userEvent.setup()
    const updatedNote: Note = {
      ...NOTE,
      title: 'Updated launch plan',
      content: '<p>Updated content</p>',
    }
    mockedGetNote.mockResolvedValue(NOTE)
    mockedUpdateNote.mockResolvedValue(updatedNote)

    renderApp(`/notes/${NOTE.id}/edit`)

    const titleInput = await screen.findByDisplayValue('Launch plan')
    const contentInput = screen.getByLabelText('Note content')
    expect(contentInput).toHaveValue(NOTE.content)

    await user.clear(titleInput)
    await user.type(titleInput, 'Updated launch plan')
    await user.clear(contentInput)
    await user.type(contentInput, '<p>Updated content</p>')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockedUpdateNote).toHaveBeenCalledWith(NOTE.id, {
        title: 'Updated launch plan',
        content: '<p>Updated content</p>',
      })
    })
  })

  it('asks for confirmation and removes a note only after deletion succeeds', async () => {
    const user = userEvent.setup()
    mockedListNotes.mockResolvedValue([NOTE])
    mockedDeleteNote.mockResolvedValue()

    renderApp('/dashboard')

    await screen.findByRole('heading', { name: 'Launch plan' })
    const deleteButton = screen.getByRole('button', { name: 'Delete Launch plan' })
    await user.click(deleteButton)

    let confirmation = screen.getByRole('group', {
      name: 'Delete Launch plan confirmation',
    })
    expect(screen.getByRole('heading', { name: 'Launch plan' })).toBeInTheDocument()

    const cancelButton = within(confirmation).getByRole('button', { name: 'Cancel' })
    expect(cancelButton).toHaveFocus()
    await user.click(cancelButton)

    expect(mockedDeleteNote).not.toHaveBeenCalled()
    const restoredDeleteButton = screen.getByRole('button', {
      name: 'Delete Launch plan',
    })
    expect(restoredDeleteButton).toHaveFocus()

    await user.click(restoredDeleteButton)
    confirmation = screen.getByRole('group', {
      name: 'Delete Launch plan confirmation',
    })

    await user.click(within(confirmation).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockedDeleteNote).toHaveBeenCalledWith(NOTE.id))
    expect(
      screen.queryByRole('heading', { name: 'Launch plan' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Note deleted.')
    expect(screen.getByRole('heading', { name: 'Your notes' })).toHaveFocus()
  })

  it('keeps a load failure retryable', async () => {
    const user = userEvent.setup()
    mockedListNotes
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce([NOTE])

    renderApp('/dashboard')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not connect to the server. Please try again.',
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Launch plan' }),
    ).toBeInTheDocument()
    expect(mockedListNotes).toHaveBeenCalledTimes(2)
  })

  it('invalidates an expired session and returns to login', async () => {
    mockedListNotes.mockRejectedValue(
      responseError(401, 'UNAUTHENTICATED', 'Authentication is required.'),
    )

    renderApp('/dashboard')

    expect(
      await screen.findByRole('heading', { name: 'Sign in to your notes' }),
    ).toBeInTheDocument()
    expect(mockedLogoutUser).not.toHaveBeenCalled()
  })

  it('mounts the real rich-text editor and emits formatted HTML', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn<(value: string) => void>()

    render(
      <ActualRichTextEditor
        value=""
        onChange={handleChange}
        ariaDescribedBy="content-error"
      />,
    )

    const editor = await screen.findByRole('textbox', { name: 'Note content' })
    const originalElementFromPoint = document.elementFromPoint
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => editor,
    })

    try {
      await user.click(screen.getByRole('button', { name: 'Bold' }))
      await user.type(editor, 'Hello')

      await waitFor(() => expect(handleChange).toHaveBeenCalled())
      expect(handleChange.mock.calls.at(-1)?.[0]).toContain(
        '<strong>Hello</strong>',
      )
    } finally {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: originalElementFromPoint,
      })
    }
  })
})
