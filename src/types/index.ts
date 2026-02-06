export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토'

export interface TimeBlock {
  day: DayOfWeek
  startTime: string  // "09:00"
  endTime: string    // "09:50"
  room: string       // "090408-0" | "미정"
  group: number      // "/" 구분 인덱스 (0: 첫번째 블록, 1: 두번째 블록 등)
}

export interface Course {
  id: string                 // 학수번호-분반 (예: "11967-01")
  code: string               // 학수번호
  section: string            // 분반
  name: string               // 과목명
  college: string            // 단과대학
  department: string         // 학부/학과
  major: string              // 전공
  year: string               // 학년 ("1"~"5" | "전체")
  credits: number            // 학점 숫자
  creditDetail: string       // 학-강-실 원본 문자열
  professors: string[]       // 교수명 리스트 (팀티칭 대응)
  category: string           // 이수구분
  timeBlocks: TimeBlock[]    // 강의 시간블록 리스트
  timeRaw?: string           // 원본 강의시간 문자열 (예: "화2")
  roomRaw?: string           // 원본 강의실 문자열 (예: "060141(성지관)")
  note: string               // 비고
  isTimeConfirmed: boolean   // 강의시간 확정 여부
  isCodeShare?: boolean      // 코드쉐어 여부 (동일 코드 여러 분반/과목 공유시 표시)
  isMicrodegree?: boolean    // 마이크로디그리 여부
  microdegreeNames?: string[] // 마이크로디그리명 리스트
  capacity?: string          // 수강인원 제한
  organizer?: string         // 운영 기관 (온라인강좌)
  partnerUniversity?: string // 협력대학 (온라인강좌)
}

export interface Semester {
  id: string
  label: string
  courses: Course[]
}

export interface FilterState {
  keyword: string
  categories: string[]       // 이수구분
  colleges: string[]         // 단과대학
  years: string[]            // 학년
  days: DayOfWeek[]          // 요일
  credits: number[]          // 학점
  timeConfirmedOnly: boolean // 시간 확정된 강의만
}

export interface SelectedCourse {
  course: Course
  color: string              // hex 색상
}
