
import { apiClient } from './client'

export interface User {
  id: string
  name: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface UserResponse {
  success: true
  data: {
    user: User
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<UserResponse>('/auth/me')
  return response.data.data.user
}

export async function loginUser(input: LoginRequest): Promise<User> {
  const response = await apiClient.post<UserResponse>('/auth/login', input)
  return response.data.data.user
}

export async function registerUser(input: RegisterRequest): Promise<User> {
  const response = await apiClient.post<UserResponse>('/auth/register', input)
  return response.data.data.user
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/auth/logout')
}
