import { useRef, useState, useEffect, type ReactNode } from 'react'
import { type FilterState, type DayOfWeek } from '../types/index.ts'
import { INITIAL_FILTER } from '../utils/filterCourses.ts'

const CATEGORIES = ['교필', '교선', '전필', '전선', '온라인', '학기', '교직', '일선', '코드쉐어', '마이크로디그리']
const YEARS = ['1', '2', '3', '4', '5', '전체']
const WEEKDAYS: DayOfWeek[] = ['월', '화', '수', '목', '금']
const CREDITS = [0, 1, 2, 3, 4, 5, 6]

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

function hasActiveFilter(f: FilterState): boolean {
  return f.keyword !== ''
    || f.categories.join(',') !== INITIAL_FILTER.categories.join(',')
    || f.colleges.length > 0
    || f.years.length > 0
    || f.days.length > 0
    || f.credits.length > 0
    || f.timeConfirmedOnly
}

interface Props {
  filter: FilterState
  onChange: (filter: FilterState) => void
  colleges: string[]
}

export default function SearchAndFilter({ filter, onChange, colleges }: Props) {
  const [isCollegeOpen, setIsCollegeOpen] = useState(false)
  const collegeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (collegeRef.current && !collegeRef.current.contains(e.target as Node)) {
        setIsCollegeOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div className="rounded-lg p-2 lg:p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* 키워드 검색 */}
      <input
        type="text"
        placeholder="과목명, 교수명 검색..."
        value={filter.keyword}
        onChange={e => onChange({ ...filter, keyword: e.target.value })}
        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-slate-700"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', outline: 'none' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      />

      {/* 필터 행들 (데스크톱만 보임) */}
      <div className="hidden lg:block mt-3 space-y-2">
        {/* 이수구분 */}
        <FilterRow label="이수구분">
          {CATEGORIES.map(cat => (
            <ToggleBtn
              key={cat}
              active={filter.categories.includes(cat)}
              onClick={() => onChange({ ...filter, categories: [cat] })}
            >{cat}</ToggleBtn>
          ))}
        </FilterRow>

        {/* 단과대학 (드롭다운 다중 선택) */}
        <FilterRow label="단과대학">
          <div ref={collegeRef} className="flex items-center gap-1.5 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setIsCollegeOpen(s => !s)}
                className="px-2.5 py-1 rounded-md text-sm font-medium transition-colors"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: filter.colleges.length > 0 ? 'var(--primary)' : '#f1f5f9',
                  color: filter.colleges.length > 0 ? 'white' : '#475569',
                }}
              >
                단과대학 ▾
              </button>

              {isCollegeOpen && (
                <div
                  className="absolute z-20 mt-1 rounded-lg shadow-lg"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    minWidth: '220px',
                  }}
                >
                  {/* 모든 대학 */}
                  <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={colleges.length > 0 && filter.colleges.length === colleges.length}
                      onChange={() => onChange({
                        ...filter,
                        colleges: filter.colleges.length === colleges.length ? [] : [...colleges],
                      })}
                    />
                    <span className="text-sm font-semibold text-slate-700">모든 대학</span>
                  </label>
                  <div style={{ borderTop: '1px solid var(--border)' }} />
                  {colleges.map(college => (
                    <label
                      key={college}
                      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={filter.colleges.includes(college)}
                        onChange={() => onChange({ ...filter, colleges: toggleItem(filter.colleges, college) })}
                      />
                      <span className="text-sm text-slate-700">{college}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 단과대학 태그 */}
            {filter.colleges.map(college => (
              <span
                key={college}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#eef2ff', color: 'var(--primary)' }}
              >
                {college}
                <button
                  type="button"
                  onClick={() => onChange({ ...filter, colleges: filter.colleges.filter(c => c !== college) })}
                  className="leading-none hover:opacity-70"
                >×</button>
              </span>
            ))}
          </div>
        </FilterRow>

        {/* 학년 */}
        <FilterRow label="학년">
          {YEARS.map(year => (
            <ToggleBtn
              key={year}
              active={filter.years.includes(year)}
              onClick={() => onChange({ ...filter, years: toggleItem(filter.years, year) })}
            >{year}</ToggleBtn>
          ))}
        </FilterRow>

        {/* 요일 */}
        <FilterRow label="요일">
          {WEEKDAYS.map(day => (
            <ToggleBtn
              key={day}
              active={filter.days.includes(day)}
              onClick={() => onChange({ ...filter, days: toggleItem(filter.days, day) })}
            >{day}</ToggleBtn>
          ))}
        </FilterRow>

        {/* 학점 */}
        <FilterRow label="학점">
          <div className="flex items-center gap-3">
            {CREDITS.map(credit => (
              <label key={credit} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.credits.includes(credit)}
                  onChange={() => onChange({ ...filter, credits: toggleItem(filter.credits, credit) })}
                />
                <span className="text-sm text-slate-700">{credit}</span>
              </label>
            ))}
          </div>
        </FilterRow>
      </div>

      {/* 모바일 간단 필터 */}
      <div className="lg:hidden mt-2">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.slice(0, 6).map(cat => (
            <button
              key={cat}
              onClick={() => onChange({ ...filter, categories: [cat] })}
              className="px-2 py-0.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter.categories.includes(cat) ? 'var(--primary)' : '#f1f5f9',
                color: filter.categories.includes(cat) ? 'white' : '#475569',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 하단: 시간확정 체크 + 초기화 */}
      <div className="hidden lg:flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.timeConfirmedOnly}
            onChange={e => onChange({ ...filter, timeConfirmedOnly: e.target.checked })}
          />
          <span className="text-sm text-slate-700">시간 확정된 강의만</span>
        </label>

        {hasActiveFilter(filter) && (
          <button
            onClick={() => onChange(INITIAL_FILTER)}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  )
}

// ── 하위 컴포넌트 ──

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
      <span
        className="text-xs font-semibold text-slate-500 flex-shrink-0 sm:text-right"
        style={{ minWidth: '56px' }}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">{children}</div>
    </div>
  )
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? 'var(--primary)' : '#f1f5f9',
        color: active ? 'white' : '#475569',
      }}
    >
      {children}
    </button>
  )
}
