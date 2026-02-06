// 50분제: 숫자 교시 0~13
export const PERIOD_50MIN: Record<number, { start: string; end: string }> = {
  0:  { start: '08:00', end: '08:50' },
  1:  { start: '09:00', end: '09:50' },
  2:  { start: '10:00', end: '10:50' },
  3:  { start: '11:00', end: '11:50' },
  4:  { start: '12:00', end: '12:50' },
  5:  { start: '13:00', end: '13:50' },
  6:  { start: '14:00', end: '14:50' },
  7:  { start: '15:00', end: '15:50' },
  8:  { start: '16:00', end: '16:50' },
  9:  { start: '17:00', end: '17:50' },
  10: { start: '18:00', end: '18:50' },
  11: { start: '19:00', end: '19:50' },
  12: { start: '20:00', end: '20:50' },
  13: { start: '21:00', end: '21:50' },
}

// 75분제: 영문 교시 A~G
export const PERIOD_75MIN: Record<string, { start: string; end: string }> = {
  A: { start: '09:00', end: '10:15' },
  B: { start: '10:30', end: '11:45' },
  C: { start: '12:00', end: '13:15' },
  D: { start: '13:30', end: '14:45' },
  E: { start: '15:00', end: '16:15' },
  F: { start: '16:30', end: '17:45' },
  G: { start: '18:00', end: '19:15' },
}
