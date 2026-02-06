import { CORE_COURSES } from './core.ts'
import { ELECTIVES_COURSES } from './electives.ts'
import { MAJOR_REQUIRED_COURSES } from './major_required.ts'
import { MAJOR_ELECTIVE_COURSES } from './major_elective.ts'
import { SEMESTER_COURSES } from './semester.ts'
import { NORMAL_ELECTIVE_COURSES } from './normal_electives.ts'
import { TEACHING_COURSES } from './teaching.ts'
import { ONLINE_COURSES } from './online.ts'

// 모든 과목 통합
// 통합 후 `id` 기준으로 중복 제거 (앞쪽 목록 우선)
const ALL = [
  ...CORE_COURSES,
  ...ELECTIVES_COURSES,
  ...MAJOR_REQUIRED_COURSES,
  ...MAJOR_ELECTIVE_COURSES,
  ...SEMESTER_COURSES,
  ...NORMAL_ELECTIVE_COURSES,
  ...TEACHING_COURSES,
  ...ONLINE_COURSES,
]

const seen = new Set<string>()
export const COURSES = ALL.filter(c => {
  if (seen.has(c.id)) return false
  seen.add(c.id)
  return true
})

export default COURSES
