
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen, waitFor, type RenderResult } from '@testing-library/react'
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
import { AuthProvider } from '../auth/AuthProvider'

jest.mock('../api/auth.api', () => ({
  getCurrentUser: jest.fn(),
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  logoutUser: jest.fn(),
}))

const mockedGetCurrentUser = jest.mocked(getCurrentUser)
const mockedLoginUser = jest.mocked(loginUser)
const mockedRegisterUser = jest.mocked(registerUser)
const mockedLogoutUser = jest.mocked(logoutUser)

const USER: User = {
  id: '507f1f77bcf86cd799439011',
  name: 'Arfa Riaz',
  email: 'arfa@example.com',
}

interface TestResponseError {
  isAxiosError: true
  response: {
    status: number
    data: {
      success: false
      error: {
        code: string
        message: string
        details?: Array<{ field: string; message: string }>
      }
    }
  }
}

function responseError(
  status: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>,
): TestResponseError {
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

const networkError: { isAxiosError: true } = { isAxiosError: true }

function renderApp(path: string): RenderResult {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('frontend authentication flow', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedGetCurrentUser.mockRejectedValue(
      responseError(401, 'UNAUTHENTICATED', 'Authentication is required.'),
    )
  })

  it('restores an authenticated session and renders the dashboard', async () => {
    mockedGetCurrentUser.mockResolvedValue(USER)

    renderApp('/dashboard')

    expect(screen.getByRole('status')).toHaveTextContent('Opening your workspace')
    expect(
      await screen.findByRole('heading', { name: 'Welcome, Arfa.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('arfa@example.com')).toBeInTheDocument()
  })

  it('redirects a signed-out visitor from the dashboard to login', async () => {
    renderApp('/dashboard')

    expect(
      await screen.findByRole('heading', { name: 'Sign in to your notes' }),
    ).toBeInTheDocument()
  })

  it('validates login locally and submits the exact backend payload', async () => {
    const user = userEvent.setup()
    mockedLoginUser.mockResolvedValue(USER)
    renderApp('/login')

    await screen.findByRole('heading', { name: 'Sign in to your notes' })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(mockedLoginUser).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Email address'), ' arfa@example.com ')
    await user.type(screen.getByLabelText('Password'), 'example-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockedLoginUser).toHaveBeenCalledWith({
        email: 'arfa@example.com',
        password: 'example-password',
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Welcome, Arfa.' }),
    ).toBeInTheDocument()
  })

  it('shows the backend generic invalid-credentials message', async () => {
    const user = userEvent.setup()
    mockedLoginUser.mockRejectedValue(
      responseError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
      ),
    )
    renderApp('/login')

    await screen.findByRole('heading', { name: 'Sign in to your notes' })
    await user.type(screen.getByLabelText('Email address'), 'arfa@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    )
  })

  it('registers with the exact payload and enters the protected dashboard', async () => {
    const user = userEvent.setup()
    mockedRegisterUser.mockResolvedValue(USER)
    renderApp('/register')

    await screen.findByRole('heading', { name: 'Create your account' })
    await user.type(screen.getByLabelText('Full name'), ' Arfa Riaz ')
    await user.type(screen.getByLabelText('Email address'), ' arfa@example.com ')
    await user.type(screen.getByLabelText('Password'), 'example-password')
    await user.type(screen.getByLabelText('Confirm password'), 'example-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledWith({
        name: 'Arfa Riaz',
        email: 'arfa@example.com',
        password: 'example-password',
        confirmPassword: 'example-password',
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Welcome, Arfa.' }),
    ).toBeInTheDocument()
  })

  it('maps a duplicate-email response to the email field', async () => {
    const user = userEvent.setup()
    mockedRegisterUser.mockRejectedValue(
      responseError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'An account with this email already exists.',
      ),
    )
    renderApp('/register')

    await screen.findByRole('heading', { name: 'Create your account' })
    await user.type(screen.getByLabelText('Full name'), 'Arfa Riaz')
    await user.type(screen.getByLabelText('Email address'), 'arfa@example.com')
    await user.type(screen.getByLabelText('Password'), 'example-password')
    await user.type(screen.getByLabelText('Confirm password'), 'example-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('logs out successfully and returns to login', async () => {
    const user = userEvent.setup()
    mockedGetCurrentUser.mockResolvedValue(USER)
    mockedLogoutUser.mockResolvedValue()
    renderApp('/dashboard')

    await screen.findByRole('heading', { name: 'Welcome, Arfa.' })
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(mockedLogoutUser).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole('heading', { name: 'Sign in to your notes' }),
    ).toBeInTheDocument()
  })

  it('keeps the user signed in when logout cannot reach the server', async () => {
    const user = userEvent.setup()
    mockedGetCurrentUser.mockResolvedValue(USER)
    mockedLogoutUser.mockRejectedValue(networkError)
    renderApp('/dashboard')

    await screen.findByRole('heading', { name: 'Welcome, Arfa.' })
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not connect to the server. Please try again.',
    )
    expect(
      screen.getByRole('heading', { name: 'Welcome, Arfa.' }),
    ).toBeInTheDocument()
  })

  it('shows a retry screen for a session network failure', async () => {
    const user = userEvent.setup()
    mockedGetCurrentUser.mockRejectedValueOnce(networkError).mockResolvedValue(USER)
    renderApp('/dashboard')

    expect(
      await screen.findByRole('heading', {
        name: 'We could not reach your workspace',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Welcome, Arfa.' }),
    ).toBeInTheDocument()
    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(2)
  })
})
