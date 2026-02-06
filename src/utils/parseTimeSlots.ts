import { PERIOD_50MIN, PERIOD_75MIN } from '../constants/timeMap.ts'
import { type DayOfWeek, type TimeBlock } from '../types/index.ts'

const DAY_CHARS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토']

function isDayChar(ch: string): ch is DayOfWeek {
  return DAY_CHARS.includes(ch as DayOfWeek)
}

/** 교시 식별자("3", "A" 등)를 실제 시간으로 변환 */
function getPeriodTime(period: string): { start: string; end: string } | null {
  const upper = period.toUpperCase()
  if (upper in PERIOD_75MIN) {
    return PERIOD_75MIN[upper]
  }
  const num = parseInt(period, 10)
  if (!isNaN(num) && num >= 0 && num <= 13) {
    return PERIOD_50MIN[num]
  }
  return null
}

/**
 * "/" 구분 없는 단일 시간 문자열을 (요일, 교시) 쌍 리스트로 파싱.
 * 토큰 앞에 요일 문자가 있으면 새 요일로 분기, 없으면 이전 요일 유지.
 */
function parsePart(part: string): { day: DayOfWeek; period: string }[] {
  const tokens = part.split(',').map(t => t.trim()).filter(Boolean)
  const result: { day: DayOfWeek; period: string }[] = []
  let currentDay: DayOfWeek | null = null

  for (const token of tokens) {
    if (isDayChar(token[0])) {
      currentDay = token[0]
      const periodStr = token.slice(1)
      if (periodStr) {
        result.push({ day: currentDay, period: periodStr })
      }
    } else if (currentDay) {
      result.push({ day: currentDay, period: token })
    }
  }

  return result
}

/**
 * 강의시간 문자열과 강의실 문자열을 파싱하여 TimeBlock 리스트로 변환.
 *
 * @param timeStr - K열 강의시간 값 (예: "화3/금2,3")
 * @param roomStr - L열 강의실 값   (예: "090411-0/090522-0")
 */
export function parseTimeSlots(timeStr: string, roomStr: string): TimeBlock[] {
  const trimmed = timeStr.trim()
  if (!trimmed || trimmed === '미정' || trimmed === '0') {
    return []
  }

  const timeParts = trimmed.split('/')
  const roomParts = roomStr.split('/')
  const result: TimeBlock[] = []

  for (let i = 0; i < timeParts.length; i++) {
    const part = timeParts[i].trim()
    if (!part) continue // "/" 한쪽이 빈 경우 건너뜀

    // roomStr에 "/"가 있으면 인덱스별 매칭, 없으면 단일 강의실 공유
    const room = roomParts.length > 1
      ? (roomParts[i]?.trim() || '미정')
      : (roomParts[0]?.trim() || '미정')

    const dayPeriods = parsePart(part)

    for (const { day, period } of dayPeriods) {
      const timeRange = getPeriodTime(period)
      if (timeRange) {
        result.push({
          day,
          startTime: timeRange.start,
          endTime: timeRange.end,
          room: room || '미정',
          group: i,
        })
      }
    }
  }

  return result
}
