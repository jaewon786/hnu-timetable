import { type Semester, type SelectedCourse } from '../types/index.ts'

const KEY = 'unitimetable_data'

interface StoredData {
  semesters: Semester[]
  selectedCourses: SelectedCourse[]
}

export function saveTimetable(semesters: Semester[], selectedCourses: SelectedCourse[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ semesters, selectedCourses }))
  } catch {
    // quota exceeded 등 무시
  }
}

export function loadTimetable(): StoredData | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearTimetable(): void {
  localStorage.removeItem(KEY)
}
