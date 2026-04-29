import api from './client'

export const listTravel = (status?: string) =>
  api.get('/travel', { params: status ? { status } : undefined }).then((r) => r.data)

export const getTravel = (id: string) => api.get(`/travel/${id}`).then((r) => r.data)

export const createTravel = (data: object) => api.post('/travel', data).then((r) => r.data)

export const updateTravel = (id: string, data: object) =>
  api.put(`/travel/${id}`, data).then((r) => r.data)

export const deleteTravel = (id: string) => api.delete(`/travel/${id}`)

export const submitTravel = (id: string) =>
  api.post(`/travel/${id}/submit`).then((r) => r.data)

export const reviewTravel = (id: string, action: 'approve' | 'reject', review_note?: string) =>
  api.post(`/travel/${id}/review`, { action, review_note }).then((r) => r.data)
