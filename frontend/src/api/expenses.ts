import api from './client'

export const listExpenses = (status?: string) =>
  api.get('/expenses', { params: status ? { status } : undefined }).then((r) => r.data)

export const getExpense = (id: string) => api.get(`/expenses/${id}`).then((r) => r.data)

export const createExpense = (data: { title: string; travel_request_id?: string; currency?: string }) =>
  api.post('/expenses', data).then((r) => r.data)

export const updateExpense = (id: string, data: object) =>
  api.put(`/expenses/${id}`, data).then((r) => r.data)

export const deleteExpense = (id: string) => api.delete(`/expenses/${id}`)

export const submitExpense = (id: string) =>
  api.post(`/expenses/${id}/submit`).then((r) => r.data)

export const reviewExpense = (id: string, action: 'approve' | 'reject', review_note?: string) =>
  api.post(`/expenses/${id}/review`, { action, review_note }).then((r) => r.data)

export const addItem = (reportId: string, data: object) =>
  api.post(`/expenses/${reportId}/items`, data).then((r) => r.data)

export const updateItem = (reportId: string, itemId: string, data: object) =>
  api.put(`/expenses/${reportId}/items/${itemId}`, data).then((r) => r.data)

export const deleteItem = (reportId: string, itemId: string) =>
  api.delete(`/expenses/${reportId}/items/${itemId}`)

export const uploadReceipt = (reportId: string, itemId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/expenses/${reportId}/items/${itemId}/receipt`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const listReimbursementQueue = () =>
  api.get('/expenses/reimbursement-queue').then((r) => r.data)

export const markPaid = (id: string) =>
  api.post(`/expenses/${id}/mark-paid`).then((r) => r.data)
