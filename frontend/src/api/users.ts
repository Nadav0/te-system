import api from './client'

export const listUsers = () => api.get('/users').then((r) => r.data)

export const createUser = (data: {
  full_name: string
  email: string
  role: string
  department?: string
  password: string
  manager_id?: string
}) => api.post('/users', data).then((r) => r.data)

export const updateMe = (data: { full_name?: string; email?: string }) =>
  api.patch('/users/me', data).then((r) => r.data)
