import { describe, it, expect } from 'vitest'
import { detectConflict } from './detectConflict.ts'
import { type Course, type SelectedCourse } from '../types/index.ts'

/** 테스트용 최소 Course 팩토리 */
function makeCourse(overrides: Partial<Course> & { id: string }): Course {
  return {
    id: overrides.id,
    code: overrides.id.split('-')[0],
    section: overrides.id.split('-')[1] ?? '01',
    name: overrides.name ?? `과목-${overrides.id}`,
    college: '대학',
    department: '학과',
    major: '전공',
    year: '2',
    credits: 3,
    creditDetail: '3-3-0',
    professors: ['교수A'],
    category: '전필',
    timeBlocks: overrides.timeBlocks ?? [],
    note: '',
    isTimeConfirmed: overrides.isTimeConfirmed ?? true,
    ...overrides,
  }
}

function sel(course: Course): SelectedCourse {
  return { course, color: '#3b82f6' }
}

describe('detectConflict', () => {
  // ── 1. 충돌 없음 (다른 요일) ──
  it('다른 요일이면 충돌 없음', () => {
    const newCourse = makeCourse({
      id: 'A-01',
      timeBlocks: [{ day: '월', startTime: '09:00', endTime: '09:50', room: 'R1', group: 0 }],
    })
    const existing = sel(makeCourse({
      id: 'B-01',
      timeBlocks: [{ day: '화', startTime: '09:00', endTime: '09:50', room: 'R2', group: 0 }],
    }))

    const result = detectConflict(newCourse, [existing])
    expect(result.isConflict).toBe(false)
    expect(result.conflictingCourseIds).toHaveLength(0)
    expect(result.conflictingBlocks).toHaveLength(0)
  })

  // ── 2. 충돌 없음 (같은 요일, 정확히 인접) ──
  it('같은 요일이지만 정확히 인접하면 충돌 없음', () => {
    const newCourse = makeCourse({
      id: 'A-01',
      timeBlocks: [{ day: '월', startTime: '10:00', endTime: '10:50', room: 'R1', group: 0 }],
    })
    const existing = sel(makeCourse({
      id: 'B-01',
      timeBlocks: [{ day: '월', startTime: '09:00', endTime: '10:00', room: 'R2', group: 0 }],
    }))

    const result = detectConflict(newCourse, [existing])
    expect(result.isConflict).toBe(false)
  })

  // ── 3. 충돌 있음 (완전 겹침, 50분제) ──
  it('같은 요일·같은 시간 50분 블록 완전 겹침', () => {
    const newCourse = makeCourse({
      id: 'A-01',
      timeBlocks: [{ day: '화', startTime: '11:00', endTime: '11:50', room: 'R1', group: 0 }],
    })
    const existing = sel(makeCourse({
      id: 'B-01',
      timeBlocks: [{ day: '화', startTime: '11:00', endTime: '11:50', room: 'R2', group: 0 }],
    }))

    const result = detectConflict(newCourse, [existing])
    expect(result.isConflict).toBe(true)
    expect(result.conflictingCourseIds).toEqual(['B-01'])
    expect(result.conflictingBlocks).toHaveLength(1)
    expect(result.conflictingBlocks[0].newBlock.startTime).toBe('11:00')
    expect(result.conflictingBlocks[0].existingBlock.startTime).toBe('11:00')
  })

  // ── 4. 충돌 있음 (부분 겹침, 75분제 + 50분제 혼재) ──
  it('75분제 블록과 50분제 블록이 부분 겹침', () => {
    // 새 강의: 월 09:00~10:15 (75분)
    const newCourse = makeCourse({
      id: 'A-01',
      timeBlocks: [{ day: '월', startTime: '09:00', endTime: '10:15', room: 'R1', group: 0 }],
    })
    // 기존 강의: 월 10:00~10:50 (50분) → 09:00~10:15와 10:00에서 겹침
    const existing = sel(makeCourse({
      id: 'B-01',
      timeBlocks: [{ day: '월', startTime: '10:00', endTime: '10:50', room: 'R2', group: 0 }],
    }))

    const result = detectConflict(newCourse, [existing])
    expect(result.isConflict).toBe(true)
    expect(result.conflictingCourseIds).toEqual(['B-01'])
    expect(result.conflictingBlocks).toHaveLength(1)
  })

  // ── 5. 충돌 있음 ("/" 분리된 이론 블록이 충돌) ──
  it('이론/실습 분리 강의에서 이론 블록만 충돌', () => {
    // 새 강의: 화3(이론, group 0) / 금2,3(실습, group 1)
    const newCourse = makeCourse({
      id: 'A-01',
      timeBlocks: [
        { day: '화', startTime: '11:00', endTime: '11:50', room: 'R1', group: 0 },  // 이론
        { day: '금', startTime: '10:00', endTime: '10:50', room: 'R2', group: 1 },  // 실습
        { day: '금', startTime: '11:00', endTime: '11:50', room: 'R2', group: 1 },  // 실습
      ],
    })
    // 기존 강의: 화 11:00~11:50 → 이론 블록과만 충돌
    const existing = sel(makeCourse({
      id: 'B-01',
      timeBlocks: [{ day: '화', startTime: '11:00', endTime: '11:50', room: 'R3', group: 0 }],
    }))

    const result = detectConflict(newCourse, [existing])
    expect(result.isConflict).toBe(true)
    expect(result.conflictingBlocks).toHaveLength(1)
    expect(result.conflictingBlocks[0].newBlock.day).toBe('화')
    expect(result.conflictingBlocks[0].newBlock.group).toBe(0)  // 이론 블록
  })

  // ── 6. 미정 강의 제외 확인 ──
  it('isTimeConfirmed=false인 강의는 충돌 감지 스킵', () => {
    // 새 강의: 미정
    const newCourse = makeCourse({
      id: 'A-01',
      isTimeConfirmed: false,
      timeBlocks: [],
    })
    const existing = sel(makeCourse({
      id: 'B-01',
      timeBlocks: [{ day: '월', startTime: '09:00', endTime: '09:50', room: 'R1', group: 0 }],
    }))

    // 새 강의가 미정 → 충돌 없음
    let result = detectConflict(newCourse, [existing])
    expect(result.isConflict).toBe(false)

    // 기존 강의가 미정이고 새 강의가 같은 시간이어도 충돌 없음
    const newCourse2 = makeCourse({
      id: 'C-01',
      timeBlocks: [{ day: '월', startTime: '09:00', endTime: '09:50', room: 'R2', group: 0 }],
    })
    const existingUnconfirmed = sel(makeCourse({
      id: 'D-01',
      isTimeConfirmed: false,
      timeBlocks: [{ day: '월', startTime: '09:00', endTime: '09:50', room: 'R3', group: 0 }],
    }))

    result = detectConflict(newCourse2, [existingUnconfirmed])
    expect(result.isConflict).toBe(false)
  })
})
