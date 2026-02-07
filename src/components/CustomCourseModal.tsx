import { useEffect, useRef, useState } from 'react'
import { type DayOfWeek, type TimeBlock } from '../types/index.ts'
import useTimetableStore from '../stores/useTimetableStore.ts'

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토']

interface TimeSlot {
  day: DayOfWeek
  startTime: string
  endTime: string
  room: string
}

interface Props {
  onClose: () => void
}

export default function CustomCourseModal({ onClose }: Props) {
  const addCustomCourse = useTimetableStore((s) => s.addCustomCourse)
  const modalRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState('')
  const [professor, setProfessor] = useState('')
  const [creditDetail, setCreditDetail] = useState('3-3-0')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { day: '월', startTime: '09:00', endTime: '09:50', room: '' }
  ])

  // 페이드 트랜지션
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
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
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

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: '월', startTime: '09:00', endTime: '09:50', room: '' }])
  }

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index))
    }
  }

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const newSlots = [...timeSlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setTimeSlots(newSlots)
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('교과명을 입력해주세요.')
      return
    }

    // TimeBlock 형태로 변환
    const timeBlocks: TimeBlock[] = timeSlots.map((slot, index) => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room || '미정',
      group: index,
    }))

    addCustomCourse({
      name: name.trim(),
      professor: professor.trim(),
      creditDetail: creditDetail.trim() || '0-0-0',
      timeBlocks,
    })

    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-course-title"
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
          <h2 id="custom-course-title" className="text-base sm:text-lg font-bold text-slate-800">
            직접 강의 추가
          </h2>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-2"
          >
            &times;
          </button>
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 입력 폼 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-4">
          {/* 교과명 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              교과명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 알고리즘"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {/* 교수명 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              교수명
            </label>
            <input
              type="text"
              value={professor}
              onChange={e => setProfessor(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {/* 학-강-실 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              학-강-실
            </label>
            <input
              type="text"
              value={creditDetail}
              onChange={e => setCreditDetail(e.target.value)}
              placeholder="예: 3-3-0"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
            <p className="text-[10px] text-slate-400 mt-1">학점-강의시수-실습시수 형식으로 입력</p>
          </div>

          {/* 시간 및 강의실 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500">
                시간 및 강의실
              </label>
              <button
                type="button"
                onClick={addTimeSlot}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                }}
              >
                + 시간 추가
              </button>
            </div>

            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">시간 {index + 1}</span>
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {/* 요일 */}
                    <select
                      value={slot.day}
                      onChange={e => updateTimeSlot(index, 'day', e.target.value)}
                      className="px-2 py-1.5 rounded text-sm border"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>

                    {/* 시작 시간 */}
                    <input
                      type="text"
                      value={slot.startTime}
                      onChange={e => updateTimeSlot(index, 'startTime', e.target.value)}
                      placeholder="09:00"
                      className="px-2 py-1.5 rounded text-sm border"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />

                    {/* 종료 시간 */}
                    <input
                      type="text"
                      value={slot.endTime}
                      onChange={e => updateTimeSlot(index, 'endTime', e.target.value)}
                      placeholder="10:50"
                      className="px-2 py-1.5 rounded text-sm border"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />

                    {/* 강의실 */}
                    <input
                      type="text"
                      value={slot.room}
                      onChange={e => updateTimeSlot(index, 'room', e.target.value)}
                      placeholder="강의실"
                      className="px-2 py-1.5 rounded text-sm border"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 하단 버튼 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            시간표에 추가
          </button>
        </div>
      </div>
    </div>
  )
}
