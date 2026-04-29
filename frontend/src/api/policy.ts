import api from './client'

export const listPolicies = () => api.get('/policy').then((r) => r.data)
export const createPolicy = (data: object) => api.post('/policy', data).then((r) => r.data)
export const updatePolicy = (id: string, data: object) => api.put(`/policy/${id}`, data).then((r) => r.data)
export const deletePolicy = (id: string) => api.delete(`/policy/${id}`)
