import * as XLSX from 'xlsx'
import { parseTimeSlots } from './parseTimeSlots.ts'
import { type Course } from '../types/index.ts'

/** 셀 값을 안전하게 문자열로 변환 */
function cellStr(row: unknown[], index: number): string {
  const v = row[index]
  return v == null ? '' : String(v)
}

/**
 * 엑셀 파일을 파싱하여 Course 배열을 반환.
 * 대상 시트: "기초데이터" (헤더 1행 + 데이터 2행부터)
 */
export async function parseExcel(file: File | ArrayBuffer): Promise<Course[]> {
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const sheetName = '기초데이터'
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error(`시트 '${sheetName}'을 찾을 수 없습니다.`)
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  }) as unknown[][]

  // 헤더 행(1행) 건너뛰기
  const dataRows = rows.slice(1)

  const rawCourses: Course[] = dataRows
    .filter(row => cellStr(row, 4) !== '') // 학수번호(E열)이 있는 행만 처리
    .map(row => {
      // ── 컬럼 매핑 ──
      const collegeRaw = cellStr(row, 0)
      const college = collegeRaw === '' || collegeRaw.startsWith('#') ? '기타' : collegeRaw
      const department  = cellStr(row, 1)
      const major       = cellStr(row, 2)
      const year        = cellStr(row, 3) || '전체'
      const code        = cellStr(row, 4)
      const section     = cellStr(row, 5).padStart(2, '0')
      const name        = cellStr(row, 6)
      const category    = cellStr(row, 7)
      const creditDetailRaw = cellStr(row, 8)
      const professor   = cellStr(row, 9)
      const timeRaw     = cellStr(row, 10)
      const roomRaw     = cellStr(row, 11)
      const note        = cellStr(row, 12)

      const id = `${code}-${section}`

      // ── 학점 파싱 ──
      let credits = 0
      let creditDetail = '미정'
      if (creditDetailRaw && !creditDetailRaw.startsWith('#')) {
        creditDetail = creditDetailRaw
        const first = parseInt(creditDetailRaw.split('-')[0], 10)
        if (!isNaN(first)) credits = first
      }

      // ── 강의시간 확정 여부 ──
      const timeUnconfirmed = ['미정', '0', ''].includes(timeRaw.trim())
      const roomUnconfirmed = ['미정', '0', ''].includes(roomRaw.trim())
      const isTimeConfirmed = !timeUnconfirmed && !roomUnconfirmed

      // ── 강의 시간블록 파싱 ──
      const timeBlocks = timeUnconfirmed
        ? []
        : parseTimeSlots(timeRaw, roomUnconfirmed ? '미정' : roomRaw)

      // ── 교수명 ──
      const professors = ['미정', '0', ''].includes(professor.trim())
        ? []
        : [professor.trim()]

      return {
        id, code, section, name, college, department, major, year,
        credits, creditDetail, professors, category, timeBlocks, note, isTimeConfirmed,
      }
    })

  // ── 팀티칭 처리: 같은 id 행을 그룹화하여 professors 배열로 합침 ──
  const courseMap = new Map<string, Course>()
  for (const course of rawCourses) {
    const existing = courseMap.get(course.id)
    if (existing) {
      for (const p of course.professors) {
        if (!existing.professors.includes(p)) {
          existing.professors.push(p)
        }
      }
    } else {
      courseMap.set(course.id, { ...course })
    }
  }

  const result = Array.from(courseMap.values())
  if (result.length === 0) {
    throw new Error('파싱된 강의가 0개입니다. 파일 내용을 확인하세요.')
  }
  return result
}
