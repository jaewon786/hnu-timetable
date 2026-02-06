import useAppStore from '../stores/useAppStore.ts'
import { getCourseColor } from '../utils/courseColors.ts'
import { type DayOfWeek, type Course } from '../types/index.ts'

const ALL_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토']
const START_HOUR = 8
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR   // 14
const PX_PER_HOUR = 60
const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR // 840
const START_MIN = START_HOUR * 60             // 480

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

interface PlacedBlock {
  courseId: string
  courseName: string
  room: string
  startMin: number
  endMin: number
  col: number
  totalCols: number
}

/**
 * 각 요일별로 과목 블록을 배치 계산.
 * - 겹치는 블록은 열(col)을 나누어 표시
 * - Union-Find로 연결된 그룹의 열 수를 정확히 계산
 */
function layoutDayBlocks(courses: Course[]): Map<DayOfWeek, PlacedBlock[]> {
  const result = new Map<DayOfWeek, PlacedBlock[]>()

  for (const day of ALL_DAYS) {
    const blocks: PlacedBlock[] = []

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i]
      if (!course.isTimeConfirmed) continue

      for (const tb of course.timeBlocks) {
        if (tb.day !== day) continue
        blocks.push({
          courseId: course.id,
          courseName: course.name,
          room: tb.room,
          startMin: timeToMinutes(tb.startTime),
          endMin: timeToMinutes(tb.endTime),
          col: 0,
          totalCols: 1,
        })
      }
    }

    blocks.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

    // 탐욕 알고리즘으로 열 배정
    for (let i = 0; i < blocks.length; i++) {
      const occupied = new Set<number>()
      for (let j = 0; j < i; j++) {
        if (blocks[j].startMin < blocks[i].endMin && blocks[i].startMin < blocks[j].endMin) {
          occupied.add(blocks[j].col)
        }
      }
      let col = 0
      while (occupied.has(col)) col++
      blocks[i].col = col
    }

    // Union-Find: 전이적으로 겹치는 블록을 같은 그룹으로
    const parent = blocks.map((_, i) => i)
    const find = (x: number): number => {
      while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] }
      return x
    }
    const union = (a: number, b: number) => {
      const ra = find(a), rb = find(b)
      if (ra !== rb) parent[ra] = rb
    }

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[i].startMin < blocks[j].endMin && blocks[j].startMin < blocks[i].endMin) {
          union(i, j)
        }
      }
    }

    // 그룹별 최대 열 번호 → totalCols 계산
    const groupMaxCol = new Map<number, number>()
    for (let i = 0; i < blocks.length; i++) {
      const root = find(i)
      groupMaxCol.set(root, Math.max(groupMaxCol.get(root) ?? 0, blocks[i].col))
    }
    for (let i = 0; i < blocks.length; i++) {
      blocks[i].totalCols = (groupMaxCol.get(find(i)) ?? 0) + 1
    }

    result.set(day, blocks)
  }

  return result
}

export default function Timetable() {
  const currentSemester = useAppStore((state) => state.currentSemester)
  if (!currentSemester) return null

  const dayBlocks = layoutDayBlocks(currentSemester.courses)

  // 토요일 과목이 있는지에 따라 토 열 표시 여부
  const hasSaturday = (dayBlocks.get('토') ?? []).length > 0
  const visibleDays: DayOfWeek[] = hasSaturday
    ? ['월', '화', '수', '목', '금', '토']
    : ['월', '화', '수', '목', '금']

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* 요일 헤더 */}
      <div className="flex" style={{ backgroundColor: 'var(--surface)' }}>
        <div
          className="w-14 flex-shrink-0"
          style={{ borderRight: '1px solid var(--border)', minHeight: '36px' }}
        />
        {visibleDays.map((day, i) => (
          <div
            key={day}
            className="flex-1 text-center text-sm font-semibold py-2"
            style={{
              color: 'var(--primary)',
              borderRight: i < visibleDays.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 그리드 본문 */}
      <div className="flex">
        {/* 시간 라벨 열 */}
        <div
          className="w-14 flex-shrink-0 relative"
          style={{
            height: `${GRID_HEIGHT}px`,
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
          }}
        >
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute text-xs text-slate-400 text-right w-full pr-2"
              style={{ top: `${i * PX_PER_HOUR + 3}px` }}
            >
              {String(START_HOUR + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 요일별 열 */}
        {visibleDays.map((day, dayIdx) => {
          const blocks = dayBlocks.get(day) ?? []
          return (
            <div
              key={day}
              className="flex-1 relative"
              style={{
                height: `${GRID_HEIGHT}px`,
                borderRight: dayIdx < visibleDays.length - 1 ? '1px solid var(--border)' : 'none',
                backgroundColor: 'var(--card)',
              }}
            >
              {/* 시간 구분선 */}
              {Array.from({ length: TOTAL_HOURS - 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full"
                  style={{ top: `${(i + 1) * PX_PER_HOUR}px`, borderTop: '1px solid #e2e8f0' }}
                />
              ))}

              {/* 과목 블록 */}
              {blocks.map((block, idx) => {
                const color = getCourseColor(block.courseId)
                const top = (block.startMin - START_MIN) * (PX_PER_HOUR / 60)
                const height = (block.endMin - block.startMin) * (PX_PER_HOUR / 60)
                const leftPct = (block.col / block.totalCols) * 100
                const widthPct = 100 / block.totalCols

                return (
                  <div
                    key={idx}
                    className="absolute rounded-sm overflow-hidden"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: color.bg,
                      border: `1px solid ${color.border}`,
                      padding: '2px 4px',
                    }}
                  >
                    <p
                      className="font-semibold truncate"
                      style={{ color: color.text, fontSize: '11px', lineHeight: '14px' }}
                    >
                      {block.courseName}
                    </p>
                    {height > 30 && (
                      <p
                        className="truncate"
                        style={{ color: color.text, fontSize: '10px', lineHeight: '14px', opacity: 0.7 }}
                      >
                        {block.room}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
