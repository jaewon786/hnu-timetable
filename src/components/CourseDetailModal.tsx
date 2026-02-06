import { useEffect, useRef, useState, useMemo } from 'react'
import { type Course, type DayOfWeek } from '../types/index.ts'
import useTimetableStore from '../stores/useTimetableStore.ts'
import { computeAllConflicts } from '../utils/detectConflict.ts'

const DAY_ORDER: Record<DayOfWeek, number> = { '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5 }

/** timeBlocks를 group별로 분리하여 이론/실습 구분 표시 */
function renderTimeBlocks(course: Course) {
  const groups = new Map<number, typeof course.timeBlocks>()
  for (const tb of course.timeBlocks) {
    if (!groups.has(tb.group)) groups.set(tb.group, [])
    groups.get(tb.group)!.push(tb)
  }
  const sortedGroups = [...groups.entries()].sort((a, b) => a[0] - b[0])
  const hasMultipleGroups = sortedGroups.length > 1
  const groupLabels = ['이론', '실습']

  return sortedGroups.map(([groupIdx, blocks], i) => {
    const sorted = [...blocks].sort((a, b) => {
      const d = DAY_ORDER[a.day] - DAY_ORDER[b.day]
      return d !== 0 ? d : a.startTime.localeCompare(b.startTime)
    })

    return (
      <div key={groupIdx} className={i > 0 ? 'mt-2' : ''}>
        {hasMultipleGroups && (
          <span className="text-xs font-semibold text-slate-500 uppercase">
            {groupLabels[i] ?? `그룹${i}`}
          </span>
        )}
        <div className="mt-0.5 space-y-2">
          {sorted.map((tb, j) => (
            <div key={j} className="text-sm text-slate-700">
              <div className="font-medium">{tb.day}</div>
              <div>{tb.startTime} ~ {tb.endTime}</div>
              <div className="mt-1 text-slate-700">강의실        {tb.room}</div>
            </div>
          ))}
        </div>
      </div>
    )
  })
}

interface Props {
  course: Course
  onClose: () => void
}

export default function CourseDetailModal({ course, onClose }: Props) {
  const isSelected      = useTimetableStore((s) => s.isCourseSelected(course.id))
  const addCourse       = useTimetableStore((s) => s.addCourse)
  const removeCourse    = useTimetableStore((s) => s.removeCourse)
  const selectedCourses = useTimetableStore((s) => s.selectedCourses)
  const modalRef        = useRef<HTMLDivElement>(null)

  // 온라인 과목 판별
  const isOnlineCourse = course.organizer === '교수학습원격교육센터'
  
  // 시간 미정 여부 체크 (isTimeConfirmed가 true여도 timeBlocks가 비어있으면 미정으로 처리)
  const hasNoTime = !course.isTimeConfirmed || course.timeBlocks.length === 0

  // 충돌 상태 배지
  const hasConflict = useMemo(() => {
    if (!isSelected) return false
    return computeAllConflicts(selectedCourses).has(course.id)
  }, [isSelected, selectedCourses, course.id])

  // 페이드 트랜지션: 마운트 후 다음 프레임에서 visible = true
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Esc 키 닫기 + Focus trap
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const focusables = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables[0]
    const last  = focusables[focusables.length - 1]
    first?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus() }
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
        transition: 'background-color 200ms ease',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-2 sm:mx-4 rounded-xl shadow-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          maxHeight: '90vh',
          overflowY: 'auto',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 id="course-detail-title" className="text-base sm:text-lg font-bold text-slate-800">{course.name}</h2>
            {hasConflict && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                ⚠ 충돌
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="모달 닫기" className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-2">&times;</button>
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 본문 정보 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3">
          <InfoRow label="학수번호·분반">{course.id}</InfoRow>
          <InfoRow label="소속">
            {[course.college, course.department, course.major].filter(Boolean).join(' > ')}
          </InfoRow>
          <InfoRow label="학년">
            {course.year === '전체' ? '전체' : `${course.year}학년`}
          </InfoRow>
          <InfoRow label="교수">
            {course.professors.length > 0 ? course.professors.join(' · ') : '미정'}
          </InfoRow>
          <InfoRow label="학점">
            {`${course.credits}학점 (학-강-실: ${course.creditDetail})`}
          </InfoRow>
          <InfoRow label="이수구분">{course.category || '—'}</InfoRow>

          {/* 강의시간 */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase" style={{ display: 'block', marginBottom: '4px' }}>강의시간</span>
            {!hasNoTime
              ? renderTimeBlocks(course)
              : <span className="italic text-slate-400 text-sm">미정</span>
            }
          </div>

          {course.note && <InfoRow label="비고">{course.note}</InfoRow>}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 하단 버튼 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          {hasNoTime && !isOnlineCourse ? (
            <div className="text-center">
              <button
                disabled
                aria-label="추가 불가 — 강의시간이 미정입니다"
                className="w-full py-2 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed"
                style={{ backgroundColor: '#f1f5f9' }}
              >
                시간표에 추가
              </button>
              <p className="text-xs text-slate-400 mt-1.5">강의시간이 미정입니다</p>
            </div>
          ) : isSelected ? (
            <button
              onClick={() => { removeCourse(course.id); onClose() }}
              aria-label={`${course.name}을(를) 시간표에서 제거`}
              className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#dc2626' }}
            >
              시간표에서 제거
            </button>
          ) : (
            <div>
              <button
                onClick={() => { addCourse(course); onClose() }}
                aria-label={`${course.name}을(를) 시간표에 추가`}
                className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {isOnlineCourse ? '온라인 과목으로 추가' : '시간표에 추가'}
              </button>
              {isOnlineCourse && (
                <p className="text-xs text-slate-400 mt-1.5 text-center">시간표 그리드에는 표시되지 않습니다</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-semibold text-slate-500 flex-shrink-0 whitespace-nowrap" style={{ minWidth: '80px', paddingTop: '1px' }}>{label}</span>
      <span className="text-sm text-slate-700">{children}</span>
    </div>
  )
}
