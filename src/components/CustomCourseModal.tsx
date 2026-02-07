import { useEffect, useRef, useState } from 'react'
import { type DayOfWeek, type TimeBlock } from '../types/index.ts'
import useTimetableStore from '../stores/useTimetableStore.ts'
import { PERIOD_50MIN, PERIOD_75MIN } from '../constants/timeMap.ts'

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토']

type InputMode = 'period' | 'time'

interface TimeEntry {
  timeInput: string  // "월1 2 3" 또는 "월A"
  room: string
}

interface TimeSlot {
  day: DayOfWeek
  startTime: string
  endTime: string
  room: string
}

interface Props {
  onClose: () => void
}

// 교시 문자열을 TimeBlock[]로 파싱
function parseTimeInput(input: string, room: string): TimeBlock[] {
  const blocks: TimeBlock[] = []
  
  // 쉼표로 여러 시간대 분리 (예: "월1 2, 수3 4")
  const parts = input.split(',').map(s => s.trim()).filter(Boolean)
  
  for (const part of parts) {
    // 요일 추출 (첫 글자)
    const dayMatch = part.match(/^([월화수목금토])/)
    if (!dayMatch) continue
    
    const day = dayMatch[1] as DayOfWeek
    const rest = part.slice(1).trim()
    
    // 교시 추출 (공백으로 분리하거나 연속된 문자)
    const periods: (number | string)[] = []
    
    // 숫자 교시 (50분제): "1 2 3" 또는 "123"
    const numMatches = rest.match(/\d+/g)
    // 알파벳 교시 (75분제): "A B" 또는 "AB"
    const alphaMatches = rest.match(/[A-Ga-g]/g)
    
    if (numMatches && numMatches.length > 0) {
      // 50분제 처리
      for (const m of numMatches) {
        // "123" → [1, 2, 3] 또는 "12" → [12]
        if (m.length > 1 && parseInt(m) > 13) {
          // 연속 숫자면 각각 분리 (예: "123" → 1, 2, 3)
          for (const c of m) {
            periods.push(parseInt(c))
          }
        } else {
          periods.push(parseInt(m))
        }
      }
      
      if (periods.length === 0) continue
      
      // 연속 교시 그룹화
      const groups: number[][] = []
      let currentGroup: number[] = [periods[0] as number]
      
      for (let i = 1; i < periods.length; i++) {
        const prev = periods[i - 1] as number
        const curr = periods[i] as number
        if (curr === prev + 1) {
          currentGroup.push(curr)
        } else {
          groups.push(currentGroup)
          currentGroup = [curr]
        }
      }
      groups.push(currentGroup)
      
      // 각 그룹을 TimeBlock으로 변환
      for (const group of groups) {
        const firstPeriod = group[0]
        const lastPeriod = group[group.length - 1]
        
        const startInfo = PERIOD_50MIN[firstPeriod]
        const endInfo = PERIOD_50MIN[lastPeriod]
        
        if (startInfo && endInfo) {
          blocks.push({
            day,
            startTime: startInfo.start,
            endTime: endInfo.end,
            room: room || '미정',
            group: blocks.length,
          })
        }
      }
    } else if (alphaMatches && alphaMatches.length > 0) {
      // 75분제 처리
      for (const alpha of alphaMatches) {
        periods.push(alpha.toUpperCase())
      }
      
      // 알파벳 교시는 각각 개별 블록으로 (75분제는 보통 연속 안함)
      // 하지만 연속이면 병합
      const sortedAlphas = (periods as string[]).sort()
      const groups: string[][] = []
      let currentGroup: string[] = [sortedAlphas[0]]
      
      for (let i = 1; i < sortedAlphas.length; i++) {
        const prev = sortedAlphas[i - 1].charCodeAt(0)
        const curr = sortedAlphas[i].charCodeAt(0)
        if (curr === prev + 1) {
          currentGroup.push(sortedAlphas[i])
        } else {
          groups.push(currentGroup)
          currentGroup = [sortedAlphas[i]]
        }
      }
      groups.push(currentGroup)
      
      for (const group of groups) {
        const first = group[0]
        const last = group[group.length - 1]
        
        const startInfo = PERIOD_75MIN[first]
        const endInfo = PERIOD_75MIN[last]
        
        if (startInfo && endInfo) {
          blocks.push({
            day,
            startTime: startInfo.start,
            endTime: endInfo.end,
            room: room || '미정',
            group: blocks.length,
          })
        }
      }
    }
  }
  
  return blocks
}

export default function CustomCourseModal({ onClose }: Props) {
  const addCustomCourse = useTimetableStore((s) => s.addCustomCourse)
  const modalRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState('')
  const [professor, setProfessor] = useState('')
  const [creditDetail, setCreditDetail] = useState('3-3-0')
  const [inputMode, setInputMode] = useState<InputMode>('period')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { timeInput: '', room: '' }
  ])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { day: '월', startTime: '09:00', endTime: '09:50', room: '' }
  ])
  const [error, setError] = useState('')

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

  const addTimeEntry = () => {
    setTimeEntries([...timeEntries, { timeInput: '', room: '' }])
  }

  const removeTimeEntry = (index: number) => {
    if (timeEntries.length > 1) {
      setTimeEntries(timeEntries.filter((_, i) => i !== index))
    }
  }

  const updateTimeEntry = (index: number, field: keyof TimeEntry, value: string) => {
    const newEntries = [...timeEntries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setTimeEntries(newEntries)
    setError('')
  }

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
    setError('')
  }

  const handleSubmit = () => {
    setError('')
    
    if (!name.trim()) {
      setError('교과명을 입력해주세요.')
      return
    }

    const allBlocks: TimeBlock[] = []

    if (inputMode === 'period') {
      // 교시 입력 모드
      for (const entry of timeEntries) {
        if (!entry.timeInput.trim()) continue
        
        const blocks = parseTimeInput(entry.timeInput, entry.room)
        if (blocks.length === 0) {
          setError(`시간 형식이 올바르지 않습니다: "${entry.timeInput}"`)
          return
        }
        allBlocks.push(...blocks)
      }
    } else {
      // 시간 직접 입력 모드
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) continue
        allBlocks.push({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room || '미정',
          group: allBlocks.length,
        })
      }
    }

    if (allBlocks.length === 0) {
      setError('최소 하나의 시간을 입력해주세요.')
      return
    }

    // group 번호 재할당
    allBlocks.forEach((block, i) => {
      block.group = i
    })

    addCustomCourse({
      name: name.trim(),
      professor: professor.trim(),
      creditDetail: creditDetail.trim() || '0-0-0',
      timeBlocks: allBlocks,
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
              onChange={e => { setName(e.target.value); setError('') }}
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
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setInputMode(inputMode === 'period' ? 'time' : 'period')}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {inputMode === 'period' ? '시간으로 입력' : '교시로 입력'}
                </button>
                <button
                  type="button"
                  onClick={inputMode === 'period' ? addTimeEntry : addTimeSlot}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                  }}
                >
                  + 시간 추가
                </button>
              </div>
            </div>

            {inputMode === 'period' ? (
              /* 교시 입력 모드 */
              <>
                <div className="space-y-2">
                  {timeEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={entry.timeInput}
                        onChange={e => updateTimeEntry(index, 'timeInput', e.target.value)}
                        placeholder="월1 2 3 또는 월A"
                        className="flex-1 px-3 py-2 rounded-lg text-sm border"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      />
                      <input
                        type="text"
                        value={entry.room}
                        onChange={e => updateTimeEntry(index, 'room', e.target.value)}
                        placeholder="강의실"
                        className="w-32 px-3 py-2 rounded-lg text-sm border"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      />
                      {timeEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeEntry(index)}
                          className="text-red-500 hover:text-red-700 text-lg leading-none px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  50분제: 월1 2 3 (1~13교시) | 75분제: 월A (A~G교시)
                </p>
              </>
            ) : (
              /* 시간 직접 입력 모드 */
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex gap-1.5 items-center"
                  >
                    <select
                      value={slot.day}
                      onChange={e => updateTimeSlot(index, 'day', e.target.value)}
                      className="px-1 py-2 rounded-lg text-sm border"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                        flex: '1 1 0',
                        minWidth: 0,
                      }}
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={slot.startTime}
                      onChange={e => updateTimeSlot(index, 'startTime', e.target.value)}
                      placeholder="09:00"
                      className="px-1 py-2 rounded-lg text-sm border text-center"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                        flex: '1 1 0',
                        minWidth: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={slot.endTime}
                      onChange={e => updateTimeSlot(index, 'endTime', e.target.value)}
                      placeholder="09:50"
                      className="px-1 py-2 rounded-lg text-sm border text-center"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                        flex: '1 1 0',
                        minWidth: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={slot.room}
                      onChange={e => updateTimeSlot(index, 'room', e.target.value)}
                      placeholder="강의실"
                      className="w-32 px-2 py-2 rounded-lg text-sm border"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-500 hover:text-red-700 text-lg leading-none px-1 flex-shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-[11px] text-red-500">{error}</p>
          )}
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
