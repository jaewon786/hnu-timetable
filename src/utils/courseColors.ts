const PALETTE = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e' },
  { bg: '#ede9fe', border: '#a855f7', text: '#6b21a8' },
  { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  { bg: '#cffafe', border: '#06b6d4', text: '#0e7490' },
  { bg: '#fee2e2', border: '#f87171', text: '#991b1b' },
]

function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getCourseColor(courseId: string) {
  return PALETTE[hashCode(courseId) % PALETTE.length]
}
