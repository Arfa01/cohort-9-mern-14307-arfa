
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export interface ValidationDetail {
  field: string
  message: string
}

export interface NormalizedApiError {
  status?: number
  code: string
  message: string
  details: ValidationDetail[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readValidationDetails(value: unknown): ValidationDetail[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.field !== 'string' ||
      typeof item.message !== 'string'
    ) {
      return []
    }

    return [{ field: item.field, message: item.message }]
  })
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage: string,
): NormalizedApiError {
  if (!axios.isAxiosError(error)) {
    return {
      code: 'UNKNOWN_ERROR',
      message: fallbackMessage,
      details: [],
    }
  }

  if (error.response === undefined) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Could not connect to the server. Please try again.',
      details: [],
    }
  }

  const responseData: unknown = error.response.data

  if (!isRecord(responseData) || !isRecord(responseData.error)) {
    return {
      status: error.response.status,
      code: 'UNEXPECTED_RESPONSE',
      message: fallbackMessage,
      details: [],
    }
  }

  const code = responseData.error.code
  const message = responseData.error.message

  if (typeof code !== 'string' || typeof message !== 'string') {
    return {
      status: error.response.status,
      code: 'UNEXPECTED_RESPONSE',
      message: fallbackMessage,
      details: [],
    }
  }

  return {
    status: error.response.status,
    code,
    message,
    details: readValidationDetails(responseData.error.details),
  }
}
