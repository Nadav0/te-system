import api from './client'

export const getSummary = () => api.get('/analytics/summary').then((r) => r.data)
export const getByEmployee = () => api.get('/analytics/by-employee').then((r) => r.data)
export const getByDepartment = () => api.get('/analytics/by-department').then((r) => r.data)
export const getMonthlyTrend = () => api.get('/analytics/monthly-trend').then((r) => r.data)
export const getViolations = () => api.get('/analytics/violations').then((r) => r.data)
export const getRecentActivity = (limit = 10) =>
  api.get('/analytics/recent-activity', { params: { limit } }).then((r) => r.data)
