import { create } from 'zustand'
import { type Course, type SelectedCourse, type TimeBlock } from '../types/index.ts'
import { detectConflict, type ConflictInfo } from '../utils/detectConflict.ts'

const PALETTE = [
  '#5B8FD6', '#FF6AB3', '#6BC990', '#FFCA44', '#B678D6',
  '#FF7B4D', '#4DB8C2', '#FF6666', '#9670C9', '#4DC9B6',
  '#E5B62A', '#E76B6B', '#90C64D', '#4DA8D6', '#E58E44',
]

export interface PendingConflict extends ConflictInfo {
  course: Course
}

export interface CustomCourseInput {
  name: string
  professor: string
  creditDetail: string
  timeBlocks: TimeBlock[]
}

interface TimetableState {
  selectedCourses: SelectedCourse[]
  pendingConflict: PendingConflict | null
  customCourseCounter: number
  addCourse: (course: Course) => void
  addCustomCourse: (input: CustomCourseInput) => void
  forceAdd: (course: Course) => void
  cancelPending: () => void
  removeCourse: (courseId: string) => void
  isCourseSelected: (courseId: string) => boolean
  initFromStorage: (selectedCourses: SelectedCourse[]) => void
}

const useTimetableStore = create<TimetableState>((set, get) => ({
  selectedCourses: [],
  pendingConflict: null,
  customCourseCounter: 1,

  addCourse: (course: Course) => {
    const { selectedCourses } = get()
    if (selectedCourses.some(sc => sc.course.id === course.id)) return

    const conflict = detectConflict(course, selectedCourses)
    if (conflict.isConflict) {
      set({ pendingConflict: { ...conflict, course } })
    } else {
      const color = PALETTE[selectedCourses.length % PALETTE.length]
      set({ selectedCourses: [...selectedCourses, { course, color }] })
    }
  },

  addCustomCourse: (input: CustomCourseInput) => {
    const { selectedCourses, customCourseCounter } = get()
    
    // 고유 ID 생성 (CUSTOM-001, CUSTOM-002, ...)
    const customId = `CUSTOM-${customCourseCounter.toString().padStart(3, '0')}`
    
    // 학점 파싱 (학-강-실 형식에서 학점 추출)
    const creditParts = input.creditDetail.split('-').map(s => parseInt(s, 10))
    const credits = isNaN(creditParts[0]) ? 0 : creditParts[0]
    
    // 커스텀 Course 객체 생성
    const customCourse: Course = {
      id: customId,
      code: customId,
      section: '01',
      name: input.name,
      college: '사용자 추가',
      department: '',
      major: '',
      year: '전체',
      credits,
      creditDetail: input.creditDetail || '0-0-0',
      professors: input.professor ? [input.professor] : [],
      category: '사용자',
      timeBlocks: input.timeBlocks,
      note: '사용자가 직접 추가한 강의',
      isTimeConfirmed: true,
      isCustom: true,
    }
    
    // 충돌 감지
    const conflict = detectConflict(customCourse, selectedCourses)
    if (conflict.isConflict) {
      set({ pendingConflict: { ...conflict, course: customCourse } })
    } else {
      const color = PALETTE[selectedCourses.length % PALETTE.length]
      set({
        selectedCourses: [...selectedCourses, { course: customCourse, color }],
        customCourseCounter: customCourseCounter + 1,
      })
    }
  },

  forceAdd: (course: Course) => {
    const { selectedCourses, customCourseCounter } = get()
    if (selectedCourses.some(sc => sc.course.id === course.id)) return
    const color = PALETTE[selectedCourses.length % PALETTE.length]
    set({
      selectedCourses: [...selectedCourses, { course, color }],
      pendingConflict: null,
      // 커스텀 강의인 경우 카운터 증가
      ...(course.isCustom ? { customCourseCounter: customCourseCounter + 1 } : {}),
    })
  },

  cancelPending: () => {
    set({ pendingConflict: null })
  },

  removeCourse: (courseId: string) => {
    set(state => ({
      selectedCourses: state.selectedCourses.filter(sc => sc.course.id !== courseId),
    }))
  },

  isCourseSelected: (courseId: string) => {
    return get().selectedCourses.some(sc => sc.course.id === courseId)
  },

  initFromStorage: (selectedCourses: SelectedCourse[]) => {
    set({ selectedCourses })
  },
}))

export default useTimetableStore
