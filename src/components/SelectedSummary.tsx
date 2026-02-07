import { useState } from 'react'
import useTimetableStore from '../stores/useTimetableStore.ts'
import CustomCourseModal from './CustomCourseModal.tsx'
import TimetableManagerModal from './TimetableManagerModal.tsx'

/** creditDetail "학-강-실" 문자열에서 강·실 숫자를 추출 */
function parseCreditDetail(detail: string): { lecture: number; lab: number } {
  const parts = detail.split('-').map(s => parseInt(s, 10))
  return {
    lecture: isNaN(parts[1] ?? NaN) ? 0 : parts[1],
    lab:     isNaN(parts[2] ?? NaN) ? 0 : parts[2],
  }
}

export default function SelectedSummary() {
  const selectedCourses = useTimetableStore((s) => s.selectedCourses)
  const removeCourse    = useTimetableStore((s) => s.removeCourse)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)

  if (selectedCourses.length === 0) {
    return (
      <>
        <div className="rounded-lg p-3 sm:p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs sm:text-sm text-slate-400 text-center py-2">아직 선택한 강의가 없습니다</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowCustomModal(true)}
              className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1"
              style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--primary)',
                border: '1px dashed var(--primary)',
              }}
            >
              <span>+</span> 직접 추가
            </button>
            <button
              onClick={() => setShowManagerModal(true)}
              className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1"
              style={{
                backgroundColor: 'var(--surface)',
                color: '#6366f1',
                border: '1px solid #6366f1',
              }}
            >
              📂 불러오기
            </button>
          </div>
        </div>
        {showCustomModal && <CustomCourseModal onClose={() => setShowCustomModal(false)} />}
        {showManagerModal && <TimetableManagerModal onClose={() => setShowManagerModal(false)} />}
      </>
    )
  }

  let totalCredits = 0, totalLecture = 0, totalLab = 0
  for (const sc of selectedCourses) {
    totalCredits += sc.course.credits
    const { lecture, lab } = parseCreditDetail(sc.course.creditDetail)
    totalLecture += lecture
    totalLab     += lab
  }

  return (
    <>
      <div className="rounded-lg p-3 sm:p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        {/* 요약 숫자 행 */}
        <div className="flex items-center gap-2 sm:gap-4 mb-3">
          <div className="text-center flex-1">
            <p className="text-[10px] sm:text-xs text-slate-400">강의 수</p>
            <p className="text-base sm:text-lg font-bold text-slate-800">{selectedCourses.length}</p>
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }} />
          <div className="text-center flex-1">
            <p className="text-[10px] sm:text-xs text-slate-400">총 학점</p>
            <p className="text-base sm:text-lg font-bold text-slate-800">{totalCredits}</p>
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }} />
          <div className="text-center flex-1">
            <p className="text-[10px] sm:text-xs text-slate-400">강 / 실</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-600">{totalLecture} / {totalLab}</p>
          </div>
        </div>

        {/* 강의 칩 목록 */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {selectedCourses.map(({ course, color }) => (
            <span
              key={course.id}
              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: color + '20', color, border: `1px solid ${color}` }}
            >
              {course.isCustom && <span title="직접 추가">✏️</span>}
              {course.name}
              <button
                onClick={() => removeCourse(course.id)}
                aria-label={`${course.name} 제거`}
                className="leading-none opacity-60 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </span>
          ))}
          {/* 직접 강의 추가 버튼 */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--primary)',
              border: '1px dashed var(--primary)',
            }}
          >
            + 직접 추가
          </button>
          {/* 시간표 관리 버튼 */}
          <button
            onClick={() => setShowManagerModal(true)}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              color: '#6366f1',
              border: '1px solid #6366f1',
            }}
          >
            📂 저장/불러오기
          </button>
        </div>
      </div>
      {showCustomModal && <CustomCourseModal onClose={() => setShowCustomModal(false)} />}
      {showManagerModal && <TimetableManagerModal onClose={() => setShowManagerModal(false)} />}
    </>
  )
}
