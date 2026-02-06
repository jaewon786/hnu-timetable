import { describe, it, expect } from 'vitest'
import { parseTimeSlots } from './parseTimeSlots.ts'

describe('parseTimeSlots', () => {
  // ── 1. 단일요일 + 숫자교시 연속 ──────────────────────────────
  it('목1,2,3,4 → 목요일 1~4교시 (50분제)', () => {
    const result = parseTimeSlots('목1,2,3,4', '101001-0')

    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ day: '목', startTime: '09:00', endTime: '09:50', room: '101001-0', group: 0 })
    expect(result[1]).toEqual({ day: '목', startTime: '10:00', endTime: '10:50', room: '101001-0', group: 0 })
    expect(result[2]).toEqual({ day: '목', startTime: '11:00', endTime: '11:50', room: '101001-0', group: 0 })
    expect(result[3]).toEqual({ day: '목', startTime: '12:00', endTime: '12:50', room: '101001-0', group: 0 })
  })

  // ── 2. 복합요일 + 영문교시 ────────────────────────────────────
  it('월A,수A → 월/수 각각 A블록 (75분제)', () => {
    const result = parseTimeSlots('월A,수A', '101001-0')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ day: '월', startTime: '09:00', endTime: '10:15', room: '101001-0', group: 0 })
    expect(result[1]).toEqual({ day: '수', startTime: '09:00', endTime: '10:15', room: '101001-0', group: 0 })
  })

  // ── 3. 복합요일 + 숫자교시 혼합 ──────────────────────────────
  it('화2,3,목2,3 → 화/목 각각 2,3교시', () => {
    const result = parseTimeSlots('화2,3,목2,3', '101001-0')

    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ day: '화', startTime: '10:00', endTime: '10:50', room: '101001-0', group: 0 })
    expect(result[1]).toEqual({ day: '화', startTime: '11:00', endTime: '11:50', room: '101001-0', group: 0 })
    expect(result[2]).toEqual({ day: '목', startTime: '10:00', endTime: '10:50', room: '101001-0', group: 0 })
    expect(result[3]).toEqual({ day: '목', startTime: '11:00', endTime: '11:50', room: '101001-0', group: 0 })
  })

  // ── 4. "/" 구분 (이론 / 실습), 강의실도 분리 ─────────────────
  it('화3/금2,3 + rooms 090411-0/090522-0 → 이론(화3) + 실습(금2,3)', () => {
    const result = parseTimeSlots('화3/금2,3', '090411-0/090522-0')

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ day: '화', startTime: '11:00', endTime: '11:50', room: '090411-0', group: 0 })
    expect(result[1]).toEqual({ day: '금', startTime: '10:00', endTime: '10:50', room: '090522-0', group: 1 })
    expect(result[2]).toEqual({ day: '금', startTime: '11:00', endTime: '11:50', room: '090522-0', group: 1 })
  })

  // ── 5. 앞이 빈 "/" 패턴 ───────────────────────────────────────
  it('/월2 → 월 2교시만 파싱', () => {
    const result = parseTimeSlots('/월2', '/090411-0')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ day: '월', startTime: '10:00', endTime: '10:50', room: '090411-0', group: 1 })
  })

  // ── 6. 뒤가 빈 "/" 패턴 ───────────────────────────────────────
  it('화2,3/ → 화 2,3교시만 파싱', () => {
    const result = parseTimeSlots('화2,3/', '090411-0/')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ day: '화', startTime: '10:00', endTime: '10:50', room: '090411-0', group: 0 })
    expect(result[1]).toEqual({ day: '화', startTime: '11:00', endTime: '11:50', room: '090411-0', group: 0 })
  })

  // ── 7. 미정 ───────────────────────────────────────────────────
  it('미정 → 빈 배열 반환', () => {
    expect(parseTimeSlots('미정', '미정')).toEqual([])
  })

  // ── 8. 저녁 교시 ─────────────────────────────────────────────
  it('목8,9,10,11,12,13 → 저녁 교시까지 올바르게 매핑', () => {
    const result = parseTimeSlots('목8,9,10,11,12,13', '101001-0')

    expect(result).toHaveLength(6)
    expect(result[0]).toEqual({ day: '목', startTime: '16:00', endTime: '16:50', room: '101001-0', group: 0 })
    expect(result[1]).toEqual({ day: '목', startTime: '17:00', endTime: '17:50', room: '101001-0', group: 0 })
    expect(result[2]).toEqual({ day: '목', startTime: '18:00', endTime: '18:50', room: '101001-0', group: 0 })
    expect(result[3]).toEqual({ day: '목', startTime: '19:00', endTime: '19:50', room: '101001-0', group: 0 })
    expect(result[4]).toEqual({ day: '목', startTime: '20:00', endTime: '20:50', room: '101001-0', group: 0 })
    expect(result[5]).toEqual({ day: '목', startTime: '21:00', endTime: '21:50', room: '101001-0', group: 0 })
  })
})
