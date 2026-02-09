import { type Course, type FilterState } from '../types/index.ts'

export const INITIAL_FILTER: FilterState = {
  keyword: '',
  categories: ['교필'],
  colleges: [],
  departments: [],
  years: [],
  days: [],
  credits: [],
  timeConfirmedOnly: false,
}

export function filterCourses(courses: Course[], filter: FilterState): Course[] {
  return courses.filter(course => {
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      const inName = course.name.toLowerCase().includes(kw)
      const inProf = course.professors.some(p => p.toLowerCase().includes(kw))
      const inDept = course.department.toLowerCase().includes(kw)
      if (!inName && !inProf && !inDept) return false
    }
    
    // 이수구분 필터: 교선을 선택하면 온라인강좌(organizer가 '교수학습원격교육센터')도 함께 검색
    // 온라인을 선택하면 organizer가 '교수학습원격교육센터'인 강좌만 검색
    // 코드쉐어/마이크로디그리는 isCodeShare/isMicrodegree 속성으로 필터링
    if (filter.categories.length > 0) {
      const shouldInclude = filter.categories.some(cat => {
        if (cat === '코드쉐어') {
          return course.isCodeShare === true
        }
        if (cat === '마이크로디그리') {
          return course.isMicrodegree === true
        }
        if (cat === '교선') {
          return course.category === '교선' || course.organizer === '교수학습원격교육센터'
        }
        if (cat === '온라인') {
          return course.organizer === '교수학습원격교육센터'
        }
        return course.category.startsWith(cat)
      })
      if (!shouldInclude) return false
    }
    
    if (filter.colleges.length > 0 && !filter.colleges.includes(course.college)) return false
    if (filter.departments.length > 0 && !filter.departments.includes(course.department)) return false
    if (filter.years.length > 0) {
      const courseYears = course.year.split(',').map(y => y.trim())
      if (!filter.years.some(y => courseYears.includes(y))) return false
    }
    if (filter.days.length > 0 && !course.timeBlocks.some(tb => filter.days.includes(tb.day))) return false
    if (filter.credits.length > 0 && !filter.credits.includes(course.credits)) return false
    if (filter.timeConfirmedOnly && !course.isTimeConfirmed) return false
    return true
  })
}
