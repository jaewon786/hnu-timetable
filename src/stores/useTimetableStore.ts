import { create } from 'zustand'
import { type Course, type SelectedCourse } from '../types/index.ts'
import { detectConflict, type ConflictInfo } from '../utils/detectConflict.ts'

const PALETTE = [
  '#5B8FD6', '#FF6AB3', '#6BC990', '#FFCA44', '#B678D6',
  '#FF7B4D', '#4DB8C2', '#FF6666', '#9670C9', '#4DC9B6',
  '#E5B62A', '#E76B6B', '#90C64D', '#4DA8D6', '#E58E44',
]

export interface PendingConflict extends ConflictInfo {
  course: Course
}

interface TimetableState {
  selectedCourses: SelectedCourse[]
  pendingConflict: PendingConflict | null
  addCourse: (course: Course) => void
  forceAdd: (course: Course) => void
  cancelPending: () => void
  removeCourse: (courseId: string) => void
  isCourseSelected: (courseId: string) => boolean
  initFromStorage: (selectedCourses: SelectedCourse[]) => void
}

const useTimetableStore = create<TimetableState>((set, get) => ({
  selectedCourses: [],
  pendingConflict: null,

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

  forceAdd: (course: Course) => {
    const { selectedCourses } = get()
    if (selectedCourses.some(sc => sc.course.id === course.id)) return
    const color = PALETTE[selectedCourses.length % PALETTE.length]
    set({
      selectedCourses: [...selectedCourses, { course, color }],
      pendingConflict: null,
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
