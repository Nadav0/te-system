export const currency = (amount: number, code = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount)

export const date = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return map[status] ?? status
}

export const categoryLabel = (cat: string) =>
  cat.charAt(0).toUpperCase() + cat.slice(1)
