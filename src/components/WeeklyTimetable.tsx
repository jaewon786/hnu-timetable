import useTimetableStore from '../stores/useTimetableStore.ts'
import { type DayOfWeek } from '../types/index.ts'
import { computeAllConflicts } from '../utils/detectConflict.ts'
import { useMemo, useRef, useEffect, useState } from 'react'
import CourseDetailModal from './CourseDetailModal.tsx'

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금']
const START_HOUR = 8
const END_HOUR = 19
const TOTAL_HOURS = END_HOUR - START_HOUR       // 11
const HEADER_ROW_H = 36                         // sticky 요일 헤더 높이(px)
const START_MIN = START_HOUR * 60               // 480

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

interface PlacedBlock {
  courseId: string
  courseName: string
  professorLabel: string
  room: string
  groupLabel: string | null  // "이론" | "실습" | null
  startMin: number
  endMin: number
  col: number
  totalCols: number
  color: string              // hex
  isConflict: boolean
}

/** 요일별 블록 배치 + 겹침 열 분배 (Union-Find) */
function layoutBlocks(
  selectedCourses: ReturnType<typeof useTimetableStore.getState>['selectedCourses'],
  conflictCourseIds: Set<string>,
): Map<DayOfWeek, PlacedBlock[]> {
  const result = new Map<DayOfWeek, PlacedBlock[]>()

  for (const day of DAYS) {
    const blocks: PlacedBlock[] = []

    for (const { course, color } of selectedCourses) {
      if (!course.isTimeConfirmed) continue

      const groupSet = new Set(course.timeBlocks.map(tb => tb.group))
      const hasMultipleGroups = groupSet.size > 1
      const groupLabels = ['이론', '실습']

      const groupIndexMap = new Map<number, number>()
      ;[...groupSet].sort((a, b) => a - b).forEach((g, i) => groupIndexMap.set(g, i))

      // 현재 요일의 timeBlocks만 필터링하고 그룹별로 병합
      const dayBlocks = course.timeBlocks.filter(tb => tb.day === day)
      
      // 같은 그룹끼리 묶기 (group + room 기준)
      const groupMap = new Map<string, typeof dayBlocks>()
      for (const tb of dayBlocks) {
        const key = `${tb.group}-${tb.room}`
        if (!groupMap.has(key)) {
          groupMap.set(key, [])
        }
        groupMap.get(key)!.push(tb)
      }

      // 각 그룹을 하나의 블록으로 병합 (가장 이른 시작 ~ 가장 늦은 종료)
      const mergedBlocks: typeof dayBlocks = []
      for (const blocks of groupMap.values()) {
        blocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
        mergedBlocks.push({
          ...blocks[0],
          startTime: blocks[0].startTime,
          endTime: blocks[blocks.length - 1].endTime,
        })
      }

      // 병합된 블록들을 PlacedBlock으로 변환
      for (const tb of mergedBlocks) {
        blocks.push({
          courseId: course.id,
          courseName: course.name,
          professorLabel: course.professors.join(' · '),
          room: tb.room,
          groupLabel: hasMultipleGroups ? (groupLabels[groupIndexMap.get(tb.group) ?? 0] ?? null) : null,
          startMin: timeToMinutes(tb.startTime),
          endMin: timeToMinutes(tb.endTime),
          col: 0,
          totalCols: 1,
          color,
          isConflict: conflictCourseIds.has(course.id),
        })
      }
    }

    blocks.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

    // 탐욕 열 배정
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

    // Union-Find: 전이적 겹침 그룹
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

export default function WeeklyTimetable() {
  const selectedCourses = useTimetableStore((s) => s.selectedCourses)
  const removeCourse = useTimetableStore((s) => s.removeCourse)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [pxPerHour, setPxPerHour] = useState(60)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setPxPerHour((el.clientHeight - HEADER_ROW_H) / TOTAL_HOURS)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const conflictCourseIds = useMemo(() => computeAllConflicts(selectedCourses), [selectedCourses])
  const dayBlocks = layoutBlocks(selectedCourses, conflictCourseIds)

  const selectedCourse = selectedCourseId
    ? selectedCourses.find(sc => sc.course.id === selectedCourseId)?.course
    : null

  return (
    <>
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    <div ref={containerRef} className="rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col" style={{ border: '1px solid var(--border)' }}>
      {/* 요일 헤더 */}
      <div className="flex flex-shrink-0" style={{ backgroundColor: 'var(--surface)', height: `${HEADER_ROW_H}px` }}>
        <div
          className="w-10 sm:w-14 flex-shrink-0"
          style={{ borderRight: '1px solid var(--border)' }}
        />
        {DAYS.map((day, i) => (
          <div
            key={day}
            className="flex-1 text-center text-xs sm:text-sm font-semibold py-2"
            style={{
              color: 'var(--primary)',
              borderRight: i < DAYS.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 그리드 본문 */}
      <div className="flex flex-1 min-h-0">
        {/* 시간 라벨 열 (sticky left) */}
        <div
          className="w-10 sm:w-14 flex-shrink-0 sticky left-0 z-5 relative"
          style={{
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
          }}
        >
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute text-[10px] sm:text-xs text-slate-400 text-right w-full pr-1 sm:pr-2"
              style={{ top: `calc(${(i / TOTAL_HOURS) * 100}% + 3px)` }}
            >
              {String(START_HOUR + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 요일별 열 */}
        {DAYS.map((day, dayIdx) => {
          const blocks = dayBlocks.get(day) ?? []

          return (
            <div
              key={day}
              className="flex-1 relative"
              style={{
                borderRight: dayIdx < DAYS.length - 1 ? '1px solid var(--border)' : 'none',
                backgroundColor: 'var(--card)',
              }}
            >
              {/* 시간 구분선 */}
              {Array.from({ length: TOTAL_HOURS - 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full"
                  style={{ top: `${((i + 1) / TOTAL_HOURS) * 100}%`, borderTop: '1px solid #e2e8f0' }}
                />
              ))}

              {/* 강의 블록 */}
              {blocks.map((block, idx) => {
                const topPct = ((block.startMin - START_MIN) / (TOTAL_HOURS * 60)) * 100
                const heightPct = ((block.endMin - block.startMin) / (TOTAL_HOURS * 60)) * 100
                const heightPx = (block.endMin - block.startMin) * (pxPerHour / 60)
                const leftPct = (block.col / block.totalCols) * 100
                const widthPct = 100 / block.totalCols

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCourseId(block.courseId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCourseId(block.courseId) }}
                    aria-label={`${block.courseName} 상세 정보 보기`}
                    className="absolute overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      top: `${topPct}%`,
                      height: `${heightPct}%`,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: block.isConflict ? '#fef2f2' : block.color,
                      border: block.isConflict ? '2px dashed #dc2626' : `1px solid ${block.color}`,
                      padding: '3px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                    }}
                  >
                    {/* 삭제 버튼 (태블릿 이상에서만 표시) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCourse(block.courseId)
                      }}
                      aria-label={`${block.courseName} 제거`}
                      className="hidden md:flex absolute top-0.5 right-0.5 w-4 h-4 items-center justify-center text-xs leading-none opacity-60 hover:opacity-100 transition-opacity z-10"
                      style={{ 
                        color: block.isConflict ? '#dc2626' : 'white', 
                        backgroundColor: block.isConflict ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.2)',
                        borderRadius: '2px',
                      }}
                    >
                      ×
                    </button>

                    {/* 과목명 */}
                    <p className="font-semibold break-words text-[11px] sm:text-[13px] text-left" style={{ color: block.isConflict ? '#dc2626' : 'white', lineHeight: '1.3' }}>
                      {block.courseName}
                    </p>

                    {/* 강의실 */}
                    {heightPx > 30 && (
                      <p className="break-words text-[10px] sm:text-xs text-left" style={{ color: block.isConflict ? '#991b1b' : 'white', lineHeight: '1.3', opacity: 0.9, marginTop: '2px' }}>
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
    </>
  )
}
