import { create } from 'zustand'
import { type Semester } from '../types/index.ts'
import { COURSES } from '../data/courses.ts'

const SEMESTER: Semester = {
  id: '2026-1',
  label: '2026학년도 1학기',
  courses: COURSES,
}

interface AppState {
  currentSemester: Semester
}

const useAppStore = create<AppState>(() => ({
  currentSemester: SEMESTER,
}))

export default useAppStore
