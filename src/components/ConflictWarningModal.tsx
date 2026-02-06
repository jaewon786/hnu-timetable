import { useEffect, useRef } from 'react'
import { type Course } from '../types/index.ts'
import { type ConflictInfo } from '../utils/detectConflict.ts'
import useTimetableStore from '../stores/useTimetableStore.ts'

interface Props {
  course: ConflictInfo & { course: Course }   // pending course + conflict 정보
  onClose: () => void
}

export default function ConflictWarningModal({ course: pending, onClose }: Props) {
  const selectedCourses = useTimetableStore((s) => s.selectedCourses)
  const forceAdd        = useTimetableStore((s) => s.forceAdd)
  const modalRef        = useRef<HTMLDivElement>(null)

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

  // courseId → 강의명 맵핑 (충돌 대상 표시용)
  const courseNameMap = new Map(selectedCourses.map(sc => [sc.course.id, sc.course.name]))

  // 충돌 블록을 기존 강의별로 그룹화
  const grouped = new Map<string, typeof pending.conflictingBlocks>()
  for (const cb of pending.conflictingBlocks) {
    if (!grouped.has(cb.existingCourseId)) grouped.set(cb.existingCourseId, [])
    grouped.get(cb.existingCourseId)!.push(cb)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 rounded-xl shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-2 flex items-start justify-between">
          <h2 id="conflict-warning-title" className="text-base font-bold text-slate-800">⚠️ 시간 충돌 경고</h2>
          <button onClick={onClose} aria-label="경고 모달 닫기" className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        {/* 추가하려는 강의 정보 */}
        <div className="px-5 pb-3">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{pending.course.name}</span>
            <span className="text-slate-400 ml-1">({pending.course.id})</span>
            을 추가하려고 하는데, 아래 강의와 시간이 겹칩니다.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 충돌 카드 목록 */}
        <div className="px-5 py-3 space-y-2">
          {[...grouped.entries()].map(([existingId, blocks]) => (
            <div
              key={existingId}
              className="rounded-lg p-3"
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
            >
              {/* 충돌 강의명 + 학수번호 */}
              <p className="text-sm font-semibold text-red-700">
                {courseNameMap.get(existingId) ?? existingId}
                <span className="font-normal text-red-500 ml-1.5">({existingId})</span>
              </p>

              {/* 블록 단위 충돌 세부 정보 */}
              <div className="mt-1.5 space-y-1.5">
                {blocks.map((cb, i) => (
                  <div key={i} className="text-xs text-red-600 space-y-0.5 pl-2" style={{ borderLeft: '2px solid #f87171' }}>
                    <div>
                      <span className="text-red-400">기존:</span>{' '}
                      {cb.existingBlock.day} {cb.existingBlock.startTime}~{cb.existingBlock.endTime}
                    </div>
                    <div>
                      <span className="text-red-400">추가:</span>{' '}
                      {cb.newBlock.day} {cb.newBlock.startTime}~{cb.newBlock.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 하단 버튼 */}
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            aria-label="충돌 강의 추가 취소"
            className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            취소
          </button>
          <button
            onClick={() => { forceAdd(pending.course); onClose() }}
            aria-label={`${pending.course.name} 강제 추가`}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#dc2626' }}
          >
            강제 추가
          </button>
        </div>
      </div>
    </div>
  )
}
