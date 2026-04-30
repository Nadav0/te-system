import api from './client'

export const search = (q: string) =>
  api.get('/search', { params: { q } }).then((r) => r.data)
