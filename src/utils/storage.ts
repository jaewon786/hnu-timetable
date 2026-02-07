import { type Semester, type SelectedCourse } from '../types/index.ts'

const KEY = 'unitimetable_data'
const SAVED_TIMETABLES_KEY = 'unitimetable_saved_timetables'

interface StoredData {
  semesters: Semester[]
  selectedCourses: SelectedCourse[]
}

export interface SavedTimetable {
  id: string
  name: string
  selectedCourses: SelectedCourse[]
  createdAt: string
  updatedAt: string
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

// 저장된 시간표 목록 관리
export function getSavedTimetables(): SavedTimetable[] {
  try {
    const raw = localStorage.getItem(SAVED_TIMETABLES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTimetableAs(name: string, selectedCourses: SelectedCourse[]): SavedTimetable {
  const timetables = getSavedTimetables()
  const now = new Date().toISOString()
  
  const newTimetable: SavedTimetable = {
    id: `timetable_${Date.now()}`,
    name,
    selectedCourses,
    createdAt: now,
    updatedAt: now,
  }
  
  timetables.push(newTimetable)
  localStorage.setItem(SAVED_TIMETABLES_KEY, JSON.stringify(timetables))
  
  return newTimetable
}

export function updateSavedTimetable(id: string, selectedCourses: SelectedCourse[]): void {
  const timetables = getSavedTimetables()
  const index = timetables.findIndex(t => t.id === id)
  
  if (index !== -1) {
    timetables[index].selectedCourses = selectedCourses
    timetables[index].updatedAt = new Date().toISOString()
    localStorage.setItem(SAVED_TIMETABLES_KEY, JSON.stringify(timetables))
  }
}

export function renameSavedTimetable(id: string, newName: string): void {
  const timetables = getSavedTimetables()
  const index = timetables.findIndex(t => t.id === id)
  
  if (index !== -1) {
    timetables[index].name = newName
    timetables[index].updatedAt = new Date().toISOString()
    localStorage.setItem(SAVED_TIMETABLES_KEY, JSON.stringify(timetables))
  }
}

export function deleteSavedTimetable(id: string): void {
  const timetables = getSavedTimetables().filter(t => t.id !== id)
  localStorage.setItem(SAVED_TIMETABLES_KEY, JSON.stringify(timetables))
}

