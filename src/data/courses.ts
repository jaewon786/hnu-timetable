// Re-export 처리를 위한 래퍼 파일
// 실제 과목 데이터는 courses 폴더의 카테고리별 파일에 저장됨
export { CORE_COURSES } from './courses/core.ts'
export { ELECTIVES_COURSES } from './courses/electives.ts'
export { MAJOR_REQUIRED_COURSES } from './courses/major_required.ts'
export { MAJOR_ELECTIVE_COURSES } from './courses/major_elective.ts'
export { SEMESTER_COURSES } from './courses/semester.ts'
export { TEACHING_COURSES } from './courses/teaching.ts'
export { ONLINE_COURSES } from './courses/online.ts'
export { default as COURSES } from './courses/index.ts'