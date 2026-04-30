import api from './client'

export const listNotifications = () => api.get('/notifications').then((r) => r.data)
export const getUnreadCount = () => api.get('/notifications/unread-count').then((r) => r.data)
export const markRead = (id: string) => api.post(`/notifications/${id}/read`).then((r) => r.data)
export const markAllRead = () => api.post('/notifications/read-all').then((r) => r.data)
