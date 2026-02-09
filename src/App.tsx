import { useState, useMemo, useEffect } from 'react'
import SearchAndFilter from './components/SearchAndFilter.tsx'
import CourseList from './components/CourseList.tsx'
import WeeklyTimetable from './components/WeeklyTimetable.tsx'
import SelectedSummary from './components/SelectedSummary.tsx'
import CourseDetailModal from './components/CourseDetailModal.tsx'
import ConflictWarningModal from './components/ConflictWarningModal.tsx'
import useAppStore from './stores/useAppStore.ts'
import useTimetableStore from './stores/useTimetableStore.ts'
import { type FilterState, type Course } from './types/index.ts'
import { filterCourses, INITIAL_FILTER } from './utils/filterCourses.ts'
import { loadTimetable, saveTimetable } from './utils/storage.ts'

export default function App() {
  const currentSemester    = useAppStore((s) => s.currentSemester)
  const pendingConflict    = useTimetableStore((s) => s.pendingConflict)
  const cancelPending      = useTimetableStore((s) => s.cancelPending)
  const selectedCourses    = useTimetableStore((s) => s.selectedCourses)
  const initTimetableStore = useTimetableStore((s) => s.initFromStorage)
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER)
  const [modalCourse, setModalCourse] = useState<Course | null>(null)
  const [mobileTab, setMobileTab] = useState<'search' | 'timetable'>('timetable')

  // localStorage에서 선택 강의 복원
  useEffect(() => {
    const data = loadTimetable()
    if (data?.selectedCourses?.length) {
      initTimetableStore(data.selectedCourses)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // selectedCourses 변경 시 자동 저장
  useEffect(() => {
    saveTimetable([], selectedCourses)
  }, [selectedCourses])

  // 단과대학 목록 (드롭다운용)
  const colleges = useMemo(
    () => [
      '경상대학',
      '공과대학',
      '교무교육혁신처',
      '린튼글로벌스쿨',
      '문과대학',
      '미래한남혁신원',
      '사범대학',
      '사회과학대학',
      '생명ㆍ나노과학대학',
      '스마트융합대학',
      '아트&디자인테크놀로지대학',
      '취업ㆍ창업처(대학일자리플러스센터)',
      '탈메이지교양ㆍ융합대학'
    ],
    []
  )

  // 필터 적용 후 강의 목록
  const filteredCourses = useMemo(
    () => filterCourses(currentSemester.courses, filter),
    [currentSemester, filter]
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
      {/* 헤더 */}
      <header
        className="px-4 sm:px-6 py-2 shadow-sm flex-shrink-0"
        style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          UniTimetable
        </h1>
      </header>

      {/* 데스크톱/태블릿: 2단 레이아웃 */}
      <main className="hidden lg:flex flex-1 flex-col px-2 sm:px-3 py-2 sm:py-4 min-h-0 overflow-hidden">
        <div className="flex flex-row gap-6 flex-1 min-h-0">
          {/* 좌측: 검색·필터 + 강의 목록 */}
          <div className="flex flex-col gap-4 min-h-0 w-[60%] flex-shrink-0">
            <div className="flex-shrink-0">
              <SearchAndFilter filter={filter} onChange={setFilter} colleges={colleges} />
            </div>
            <div className="flex-1 min-h-0">
              <CourseList
                courses={filteredCourses}
                onCourseClick={setModalCourse}
                categories={filter.categories}
              />
            </div>
          </div>

          {/* 우측: 선택 강의 요약 + 주간 시간표 */}
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            <div className="flex-shrink-0">
              <SelectedSummary />
            </div>
            <WeeklyTimetable />
          </div>
        </div>
      </main>

      {/* 모바일: 탭 UI */}
      <main className="flex lg:hidden flex-1 flex-col min-h-0 overflow-hidden">
        {/* 탭 컨텐츠 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === 'search' ? (
            <div className="flex flex-col h-full px-2 py-2 gap-2">
              <div className="flex-shrink-0">
                <SearchAndFilter filter={filter} onChange={setFilter} colleges={colleges} />
              </div>
              <div className="flex-1 min-h-0">
                <CourseList
                  courses={filteredCourses}
                  onCourseClick={setModalCourse}
                  categories={filter.categories}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full px-2 py-2 gap-2">
              <div className="flex-shrink-0">
                <SelectedSummary />
              </div>
              <WeeklyTimetable />
            </div>
          )}
        </div>

        {/* 하단 탭바 */}
        <div 
          className="flex-shrink-0 flex border-t"
          style={{ 
            backgroundColor: 'var(--card)', 
            borderColor: 'var(--border)',
            height: '56px'
          }}
        >
          <button
            onClick={() => setMobileTab('timetable')}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative"
            style={{
              color: mobileTab === 'timetable' ? 'var(--primary)' : '#94a3b8'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">시간표</span>
            {selectedCourses.length > 0 && (
              <span 
                className="absolute top-1 right-1/4 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                {selectedCourses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileTab('search')}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              color: mobileTab === 'search' ? 'var(--primary)' : '#94a3b8'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">강의검색</span>
          </button>
        </div>
      </main>

      {/* 강의 상세 모달 */}
      {modalCourse && (
        <CourseDetailModal course={modalCourse} onClose={() => setModalCourse(null)} />
      )}

      {/* 충돌 경고 모달 */}
      {pendingConflict && (
        <ConflictWarningModal course={pendingConflict} onClose={cancelPending} />
      )}
    </div>
  )
}
