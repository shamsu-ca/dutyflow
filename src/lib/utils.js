export const fmt = {
  date(str) {
    if (!str) return '—'
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  },
  shortDate(str) {
    if (!str) return '—'
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  },
  today() { return new Date().toISOString().slice(0, 10) },
  initials(name = '') { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() },
}

export const STATUS_COLORS = {
  Done:      { bg: '#dcfce7', color: '#15803d', strip: '#22c55e' },
  'Not Done':{ bg: '#fee2e2', color: '#b91c1c', strip: '#ef4444' },
  Pending:   { bg: '#dbeafe', color: '#1d4ed8', strip: '#003527' },
  Cancelled: { bg: '#f3f4f6', color: '#6b7280', strip: '#9ca3af' },
  Open:      { bg: '#d1fae5', color: '#065f46', strip: '#10b981' },
}

export const STUDENT_STATUS_COLORS = {
  Active:   { bg: '#dcfce7', color: '#15803d' },
  Leave:    { bg: '#fef3c7', color: '#92400e' },
  Inactive: { bg: '#f3f4f6', color: '#6b7280' },
}
