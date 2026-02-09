import { useRef, useState, useEffect, useMemo, type ReactNode } from 'react'
import { type FilterState, type DayOfWeek } from '../types/index.ts'
import { INITIAL_FILTER } from '../utils/filterCourses.ts'
import { COLLEGE_DEPARTMENTS } from '../constants/collegeDepartments.ts'

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
    || f.departments.length > 0
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
  const [isDeptOpen, setIsDeptOpen] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const collegeRef = useRef<HTMLDivElement>(null)
  const deptRef = useRef<HTMLDivElement>(null)

  // 선택된 단과대학에 해당하는 학과 목록
  const availableDepartments = useMemo(() => {
    if (filter.colleges.length === 0) return []
    return filter.colleges.flatMap(c => COLLEGE_DEPARTMENTS[c] ?? [])
  }, [filter.colleges])

  // 단과대학 변경 시 해당하지 않는 학과 제거
  const handleCollegeChange = (newColleges: string[]) => {
    const newAvailDepts = newColleges.flatMap(c => COLLEGE_DEPARTMENTS[c] ?? [])
    const newDepts = filter.departments.filter(d => newAvailDepts.includes(d))
    onChange({ ...filter, colleges: newColleges, departments: newDepts })
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (collegeRef.current && !collegeRef.current.contains(e.target as Node)) {
        setIsCollegeOpen(false)
      }
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setIsDeptOpen(false)
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
        placeholder="과목명, 교수명, 학수번호-분반 검색..."
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
                      onChange={() => handleCollegeChange(
                        filter.colleges.length === colleges.length ? [] : [...colleges],
                      )}
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
                        onChange={() => handleCollegeChange(toggleItem(filter.colleges, college))}
                      />
                      <span className="text-sm text-slate-700">{college}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 학과 드롭다운 */}
            {availableDepartments.length > 0 && (
              <div ref={deptRef} className="relative">
                <button
                  onClick={() => setIsDeptOpen(s => !s)}
                  className="px-2.5 py-1 rounded-md text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: filter.departments.length > 0 ? 'var(--primary)' : '#f1f5f9',
                    color: filter.departments.length > 0 ? 'white' : '#475569',
                  }}
                >
                  학과 ▾
                </button>

                {isDeptOpen && (
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
                    {/* 모든 학과 */}
                    <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={availableDepartments.length > 0 && filter.departments.length === availableDepartments.length}
                        onChange={() => onChange({
                          ...filter,
                          departments: filter.departments.length === availableDepartments.length ? [] : [...availableDepartments],
                        })}
                      />
                      <span className="text-sm font-semibold text-slate-700">모든 학과</span>
                    </label>
                    <div style={{ borderTop: '1px solid var(--border)' }} />
                    {availableDepartments.map(dept => (
                      <label
                        key={dept}
                        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={filter.departments.includes(dept)}
                          onChange={() => onChange({ ...filter, departments: toggleItem(filter.departments, dept) })}
                        />
                        <span className="text-sm text-slate-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                  onClick={() => handleCollegeChange(filter.colleges.filter(c => c !== college))}
                  className="leading-none hover:opacity-70"
                >×</button>
              </span>
            ))}

            {/* 선택된 학과 태그 */}
            {filter.departments.map(dept => (
              <span
                key={dept}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
              >
                {dept}
                <button
                  type="button"
                  onClick={() => onChange({ ...filter, departments: filter.departments.filter(d => d !== dept) })}
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
          {CATEGORIES.map(cat => (
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

        {/* 상세 필터 토글 */}
        <button
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="w-full mt-2 py-1.5 text-xs text-slate-600 flex items-center justify-center gap-1 rounded"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <span>상세 필터</span>
          <svg 
            className="w-3 h-3 transition-transform" 
            style={{ transform: isMobileFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 확장 필터 */}
        {isMobileFilterOpen && (
          <div className="mt-2 space-y-2 p-2 rounded" style={{ backgroundColor: '#f8fafc' }}>
            {/* 단과대학 */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">단과대학</p>
              <div ref={collegeRef} className="relative">
                <button
                  onClick={() => setIsCollegeOpen(!isCollegeOpen)}
                  className="w-full px-2 py-1 rounded text-xs text-left flex items-center justify-between"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: filter.colleges.length > 0 ? 'var(--primary)' : '#475569'
                  }}
                >
                  <span>{filter.colleges.length > 0 ? `${filter.colleges.length}개 선택` : '전체'}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isCollegeOpen && (
                  <div
                    className="absolute z-20 mt-1 w-full rounded shadow-lg"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      maxHeight: '150px',
                      overflowY: 'auto',
                    }}
                  >
                    <label className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={colleges.length > 0 && filter.colleges.length === colleges.length}
                        onChange={() => handleCollegeChange(
                          filter.colleges.length === colleges.length ? [] : [...colleges],
                        )}
                      />
                      <span className="font-semibold">전체</span>
                    </label>
                    {colleges.map(college => (
                      <label
                        key={college}
                        className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={filter.colleges.includes(college)}
                          onChange={() => handleCollegeChange(toggleItem(filter.colleges, college))}
                        />
                        <span>{college}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 학과 (모바일) */}
            {availableDepartments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">학과</p>
                <div className="flex flex-wrap gap-1">
                  {availableDepartments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => onChange({ ...filter, departments: toggleItem(filter.departments, dept) })}
                      className="px-2 py-0.5 rounded text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: filter.departments.includes(dept) ? '#16a34a' : '#f1f5f9',
                        color: filter.departments.includes(dept) ? 'white' : '#475569',
                      }}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 학년 */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">학년</p>
              <div className="flex flex-wrap gap-1">
                {YEARS.map(year => (
                  <button
                    key={year}
                    onClick={() => onChange({ ...filter, years: toggleItem(filter.years, year) })}
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: filter.years.includes(year) ? 'var(--primary)' : '#f1f5f9',
                      color: filter.years.includes(year) ? 'white' : '#475569',
                    }}
                  >
                    {year === '전체' ? '전체' : `${year}학년`}
                  </button>
                ))}
              </div>
            </div>

            {/* 요일 */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">요일</p>
              <div className="flex gap-1">
                {WEEKDAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => onChange({ ...filter, days: toggleItem(filter.days, day) })}
                    className="flex-1 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: filter.days.includes(day) ? 'var(--primary)' : '#f1f5f9',
                      color: filter.days.includes(day) ? 'white' : '#475569',
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* 학점 */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">학점</p>
              <div className="flex flex-wrap gap-1">
                {CREDITS.map(credit => (
                  <button
                    key={credit}
                    onClick={() => onChange({ ...filter, credits: toggleItem(filter.credits, credit) })}
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: filter.credits.includes(credit) ? 'var(--primary)' : '#f1f5f9',
                      color: filter.credits.includes(credit) ? 'white' : '#475569',
                    }}
                  >
                    {credit}
                  </button>
                ))}
              </div>
            </div>

            {/* 시간확정 체크 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.timeConfirmedOnly}
                onChange={e => onChange({ ...filter, timeConfirmedOnly: e.target.checked })}
              />
              <span className="text-xs text-slate-700">시간 확정된 강의만</span>
            </label>

            {/* 초기화 버튼 */}
            {hasActiveFilter(filter) && (
              <button
                onClick={() => onChange(INITIAL_FILTER)}
                className="w-full py-1 text-xs rounded"
                style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
              >
                필터 초기화
              </button>
            )}
          </div>
        )}
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
