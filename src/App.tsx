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
      '생명.나노과학대학',
      '스마트융합대학',
      '아트&디자인테크놀로지대학',
      '취업.창업처(대학일자리플러스센터)',
      '탈메이지교양.융합대학'
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
        className="px-6 py-2 shadow-sm"
        style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          UniTimetable
        </h1>
      </header>

      {/* 본문 */}
      <main className="flex-1 flex flex-col px-3 py-4 min-h-0 overflow-hidden">
        <div className="flex gap-6 flex-1 min-h-0">
          {/* 좌측 (~60%): 검색·필터 + 강의 목록 */}
          <div className="flex flex-col gap-4 min-h-0" style={{ flex: '60' }}>
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

          {/* 우측 (~38%): 선택 강의 요약 + 주간 시간표 */}
          <div className="flex flex-col gap-4 min-h-0" style={{ flex: '38' }}>
            <div className="flex-shrink-0">
              <SelectedSummary />
            </div>
            <WeeklyTimetable />
          </div>
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
