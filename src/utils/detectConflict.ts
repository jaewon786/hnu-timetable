import { type Course, type TimeBlock, type SelectedCourse } from '../types/index.ts'

export interface ConflictBlock {
  newBlock: TimeBlock
  existingCourseId: string
  existingBlock: TimeBlock
}

export interface ConflictInfo {
  isConflict: boolean
  conflictingCourseIds: string[]
  conflictingBlocks: ConflictBlock[]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** 두 TimeBlock이 시간적으로 겹치는지 판정 (정확히 인접하면 충돌 아님) */
function blocksOverlap(a: TimeBlock, b: TimeBlock): boolean {
  if (a.day !== b.day) return false
  const aStart = timeToMinutes(a.startTime)
  const aEnd   = timeToMinutes(a.endTime)
  const bStart = timeToMinutes(b.startTime)
  const bEnd   = timeToMinutes(b.endTime)
  return aStart < bEnd && bStart < aEnd
}

/**
 * newCourse를 추가할 때 기존 selectedCourses와의 충돌을 감지한다.
 * isTimeConfirmed = false인 강의는 비교 대상에서 제외한다.
 */
export function detectConflict(newCourse: Course, existingCourses: SelectedCourse[]): ConflictInfo {
  const conflictingBlocks: ConflictBlock[] = []

  if (!newCourse.isTimeConfirmed) {
    return { isConflict: false, conflictingCourseIds: [], conflictingBlocks: [] }
  }

  for (const { course: existing } of existingCourses) {
    if (!existing.isTimeConfirmed) continue
    if (existing.id === newCourse.id) continue

    for (const newBlock of newCourse.timeBlocks) {
      for (const existingBlock of existing.timeBlocks) {
        if (blocksOverlap(newBlock, existingBlock)) {
          conflictingBlocks.push({
            newBlock,
            existingCourseId: existing.id,
            existingBlock,
          })
        }
      }
    }
  }

  const conflictingCourseIds = [...new Set(conflictingBlocks.map(cb => cb.existingCourseId))]

  return {
    isConflict: conflictingBlocks.length > 0,
    conflictingCourseIds,
    conflictingBlocks,
  }
}

/**
 * selectedCourses 전체에서 실시간 충돌 관계를 계산한다.
 * 반환값: 충돌에 관여하는 courseId Set
 */
export function computeAllConflicts(selectedCourses: SelectedCourse[]): Set<string> {
  const conflictIds = new Set<string>()

  for (let i = 0; i < selectedCourses.length; i++) {
    const a = selectedCourses[i].course
    if (!a.isTimeConfirmed) continue

    for (let j = i + 1; j < selectedCourses.length; j++) {
      const b = selectedCourses[j].course
      if (!b.isTimeConfirmed) continue

      let found = false
      for (const tbA of a.timeBlocks) {
        for (const tbB of b.timeBlocks) {
          if (blocksOverlap(tbA, tbB)) {
            found = true
            break
          }
        }
        if (found) break
      }

      if (found) {
        conflictIds.add(a.id)
        conflictIds.add(b.id)
      }
    }
  }

  return conflictIds
}
