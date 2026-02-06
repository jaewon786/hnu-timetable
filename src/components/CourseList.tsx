import { Fragment, useMemo } from 'react'
import { type Course } from '../types/index.ts'
import { getCourseColor } from '../utils/courseColors.ts'
import useTimetableStore from '../stores/useTimetableStore.ts'
import { computeAllConflicts } from '../utils/detectConflict.ts'

const DEFAULT_HEADERS = ['', '과목명', '이수구분', '학수번호', '분반', '학-강-실', '단과대학', '학과', '학년', '담당교수', '강의시간', '강의실']
const ELECTIVE_HEADERS = ['', '과목명', '이수구분', '학수번호', '분반', '학-강-실', '담당교수', '강의시간', '강의실', '비고']
const TEACHING_HEADERS = ['', '과목명', '이수구분', '학수번호', '분반', '학-강-실', '담당교수', '강의시간', '강의실', '수강 학과(전공)', '비고']
const ONLINE_HEADERS = ['', '교과목명', '이수구분', '학수번호', '분반', '학점-On-OFF', '담당교수', '수강인원', '주관', '회원대학', '비고']
const CODESHARE_HEADERS = ['', '교과목명', '주관 대학', '주관학과', '학수번호', '분반', '학강실', '학년', '이수구분', '담당교원', '강의시간', '강의실']
const MICRODEGREE_HEADERS = ['', '마이크로디그리 명', '학수번호', '교과목명', '분반', '학-강-실', '학년', '이수구분', '담당교원', '강의시간', '강의실', '비고']
const COL_WIDTHS = [1.8, 8.9, 6.4, 8.0, 4.5, 6.1, 11.7, 15.4, 6.5, 9.3, 7.1, 14.3]
// 교선 모드: 12개 열의 너비를 10개 열로 재배분
// 교필: 1.8 + 8.9 + 6.4 + 8.0 + 4.5 + 6.1 + 11.7 + 15.4 + 6.5 + 9.3 + 7.1 + 14.3 = 100
// 교선: 단과대학(11.7) + 학과(15.4) + 학년(6.5) = 33.6을 비고에 할당
const ELECTIVE_COL_WIDTHS = [1.8, 20.0, 6.4, 8.0, 4.5, 6.1, 9.3, 9.1, 14.3, 20.5]
// 교직 모드: 11개 열, 단과대학(11.7) + 학과(15.4) + 학년(6.5) = 33.6을 수강 학과(전공)에 할당
const TEACHING_COL_WIDTHS = [1.8, 8.9, 6.4, 8.0, 4.5, 6.1, 9.3, 7.1, 14.3, 20.0, 17.7]
// 온라인 모드: 11개 열
const ONLINE_COL_WIDTHS = [1.8, 8.9, 6.4, 8.0, 4.5, 6.1, 9.3, 6.0, 10.0, 17.0, 22.0]
// 코드쉐어 모드: 12개 열
const CODESHARE_COL_WIDTHS = [1.8, 15.0, 11.0, 11.0, 7.5, 4.5, 6.1, 6.0, 6.4, 9.3, 7.1, 14.3]
// 마이크로디그리 모드: 12개 열, 단과대학(11.7) + 학과(15.4) = 27.1을 마이크로디그리 명에 할당
const MICRODEGREE_COL_WIDTHS = [1.8, 20.0, 7.0, 15.4, 4.5, 6.1, 5.5, 5.9, 9.3, 10.2, 14.3, 0]

interface CourseListProps {
  courses: Course[]
  onCourseClick: (course: Course) => void
  categories?: string[] // 현재 필터된 이수구분
}

export default function CourseList({ courses, onCourseClick, categories = [] }: CourseListProps) {
  const selectedCourses = useTimetableStore((s) => s.selectedCourses)
  const conflictCourseIds = useMemo(() => computeAllConflicts(selectedCourses), [selectedCourses])
  const isCodeShare = categories.length === 1 && categories[0] === '코드쉐어'
  const isMicrodegree = categories.length === 1 && categories[0] === '마이크로디그리'
  const isElective = categories.length === 1 && (categories[0] === '교선' || categories[0] === '일선')
  const isTeaching = categories.length === 1 && categories[0] === '교직'
  const isOnline = categories.length === 1 && categories[0] === '온라인'
  const HEADERS = isMicrodegree ? MICRODEGREE_HEADERS : isCodeShare ? CODESHARE_HEADERS : isOnline ? ONLINE_HEADERS : isTeaching ? TEACHING_HEADERS : isElective ? ELECTIVE_HEADERS : DEFAULT_HEADERS
  const widths = isMicrodegree ? MICRODEGREE_COL_WIDTHS : isCodeShare ? CODESHARE_COL_WIDTHS : isOnline ? ONLINE_COL_WIDTHS : isTeaching ? TEACHING_COL_WIDTHS : isElective ? ELECTIVE_COL_WIDTHS : COL_WIDTHS
  const colCount = HEADERS.length

  return (
    <div className="flex flex-col h-full">
      {/* 테이블 (스크롤 가능) */}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
          <table style={{ tableLayout: 'fixed', width: '100%', minWidth: '1010px' }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: 'var(--surface)' }}>
                {HEADERS.map((h, i) => (
                  <th
                    key={i}
                    className="px-2 py-2.5 text-xs font-semibold text-slate-500 text-center whitespace-nowrap"
                    style={{ borderBottom: '1px solid var(--border)', width: `${widths[i]}%` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center text-slate-400 py-12 text-sm">
                    필터 조건에 맞는 강의가 없습니다.
                  </td>
                </tr>
              ) : courses.map((course, idx) => {
                const color = getCourseColor(course.id)
                const selected = selectedCourses.find(sc => sc.course.id === course.id)
                const prev = idx > 0 ? courses[idx - 1] : null
                const showGroupHeader = !isMicrodegree && !isCodeShare && (!prev || prev.name !== course.name)

                return (
                  <Fragment key={course.id}>
                    {/* 과목명 그룹 헤더 */}
                    {showGroupHeader && (
                      <tr style={{ backgroundColor: '#eef2ff' }}>
                        <td colSpan={colCount} className="px-3 py-1.5">
                          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                            {course.name}
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* 과목 행 */}
                    <tr
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      onClick={() => onCourseClick(course)}
                    >
                      {/* 선택 표시 */}
                      <td className="py-2" style={{ textAlign: 'center' }}>
                        {selected ? (
                          <div className="inline-flex items-center gap-0.5">
                            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: selected.color }} />
                            <span className="text-xs" style={{ color: selected.color }}>✓</span>
                          </div>
                        ) : (
                          <div className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: color.border }} />
                        )}
                      </td>

                      {isMicrodegree ? (
                        <>
                          {/* 마이크로디그리 명 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.microdegreeNames?.join(' · ') || undefined}>{course.microdegreeNames?.join(' · ') || '—'}</td>

                          {/* 학수번호 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.code}</td>

                          {/* 교과목명 */}
                          <td className="px-2 py-2 text-sm font-medium text-slate-700 text-center truncate" title={course.name}>{course.name}</td>

                          {/* 분반 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.section}</td>

                          {/* 학-강-실 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.creditDetail}</td>

                          {/* 학년 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.year}</td>

                          {/* 이수구분 */}
                          <td className="px-2 py-2 text-sm text-slate-700 text-center" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {course.category}
                            {conflictCourseIds.has(course.id) && (
                              <span
                                className="ml-1 text-xs font-semibold px-1 py-0.5 rounded"
                                style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
                              >충돌</span>
                            )}
                          </td>

                          {/* 담당교원 */}
                          <td
                            className={`px-2 py-2 text-sm text-center truncate ${course.professors.length > 0 ? 'text-slate-600' : 'italic text-slate-400'}`}
                            title={course.professors.length > 0 ? course.professors.join(' · ') : undefined}
                          >
                            {course.professors.length > 0 ? course.professors.join(' · ') : '미정'}
                          </td>

                          {/* 강의시간 */}
                          <td
                            className={`px-2 py-2 text-sm text-center truncate ${course.isTimeConfirmed && course.timeRaw ? 'text-slate-600' : 'italic text-slate-400'}`}
                            title={course.isTimeConfirmed && course.timeRaw ? course.timeRaw : undefined}
                          >
                            {course.isTimeConfirmed && course.timeRaw ? course.timeRaw : '미정'}
                          </td>

                          {/* 강의실 */}
                          <td
                            className={`px-2 py-2 text-sm text-center truncate ${course.isTimeConfirmed && course.roomRaw ? 'text-slate-600' : 'italic text-slate-400'}`}
                            title={course.isTimeConfirmed && course.roomRaw ? course.roomRaw : undefined}
                          >
                            {course.isTimeConfirmed && course.roomRaw ? course.roomRaw : '미정'}
                          </td>

                          {/* 비고 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.note || undefined}>{course.note || ''}</td>
                        </>
                      ) : isCodeShare ? (
                        <>
                          {/* 교과목명 */}
                          <td className="px-2 py-2 text-sm font-medium text-slate-700 text-center truncate" title={course.name}>{course.name}</td>

                          {/* 주관 대학 (코드쉐어 모드) */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.college || undefined}>{course.college || '—'}</td>

                          {/* 주관학과 (코드쉐어 모드) */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.major || undefined}>{course.major || '—'}</td>

                          {/* 학수번호 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.code}</td>

                          {/* 분반 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.section}</td>

                          {/* 학강실 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.creditDetail}</td>

                          {/* 학년 */}
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.year}</td>

                          {/* 이수구분 */}
                          <td className="px-2 py-2 text-sm text-slate-700 text-center" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {course.category}
                            {conflictCourseIds.has(course.id) && (
                              <span
                                className="ml-1 text-xs font-semibold px-1 py-0.5 rounded"
                                style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
                              >충돌</span>
                            )}
                          </td>

                          {/* 담당교수 */}
                          <td
                            className={`px-2 py-2 text-sm text-center truncate ${course.professors.length > 0 ? 'text-slate-600' : 'italic text-slate-400'}`}
                            title={course.professors.length > 0 ? course.professors.join(' · ') : undefined}
                          >
                            {course.professors.length > 0 ? course.professors.join(' · ') : '미정'}
                          </td>

                          {/* 강의시간 */}
                          <td
                            className={`px-2 py-2 text-sm text-center truncate ${course.isTimeConfirmed && course.timeRaw ? 'text-slate-600' : 'italic text-slate-400'}`}
                            title={course.isTimeConfirmed && course.timeRaw ? course.timeRaw : undefined}
                          >
                            {course.isTimeConfirmed && course.timeRaw ? course.timeRaw : '미정'}
                          </td>

                          {/* 강의실 */}
                          <td
                            className={`px-2 py-2 text-sm text-center truncate ${course.isTimeConfirmed && course.roomRaw ? 'text-slate-600' : 'italic text-slate-400'}`}
                            title={course.isTimeConfirmed && course.roomRaw ? course.roomRaw : undefined}
                          >
                            {course.isTimeConfirmed && course.roomRaw ? course.roomRaw : '미정'}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* 과목명 */}
                          <td className="px-2 py-2 text-sm font-medium text-slate-700 text-center truncate" title={course.name}>{course.name}</td>

                          {/* 이수구분 + 충돌 배지 */}
                          <td className="px-2 py-2 text-sm text-slate-700 text-center" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {course.category}
                            {conflictCourseIds.has(course.id) && (
                              <span
                                className="ml-1 text-xs font-semibold px-1 py-0.5 rounded"
                                style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
                              >충돌</span>
                            )}
                          </td>

                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.code}</td>
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.section}</td>
                          <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.creditDetail}</td>
                          {!isElective && !isTeaching && !isOnline && (
                            <>
                              <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.college || undefined}>{course.college || '—'}</td>
                              <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.department || undefined}>{course.department || '—'}</td>
                              <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.year}</td>
                            </>
                          )}

                          {/* 담당교수 */}
                          <td
                            className={`px-2 py-2 text-sm text-center truncate ${course.professors.length > 0 ? 'text-slate-600' : 'italic text-slate-400'}`}
                            title={course.professors.length > 0 ? course.professors.join(' · ') : undefined}
                          >
                            {course.professors.length > 0 ? course.professors.join(' · ') : '미정'}
                          </td>

                          {/* 강의시간 (온라인 제외) */}
                          {!isOnline && (
                            <td
                              className={`px-2 py-2 text-sm text-center truncate ${course.isTimeConfirmed && course.timeRaw ? 'text-slate-600' : 'italic text-slate-400'}`}
                              title={course.isTimeConfirmed && course.timeRaw ? course.timeRaw : undefined}
                            >
                              {course.isTimeConfirmed && course.timeRaw ? course.timeRaw : '미정'}
                            </td>
                          )}

                          {/* 강의실 (온라인 제외) */}
                          {!isOnline && (
                            <td
                              className={`px-2 py-2 text-sm text-center truncate ${course.isTimeConfirmed && course.roomRaw ? 'text-slate-600' : 'italic text-slate-400'}`}
                              title={course.isTimeConfirmed && course.roomRaw ? course.roomRaw : undefined}
                            >
                              {course.isTimeConfirmed && course.roomRaw ? course.roomRaw : '미정'}
                            </td>
                          )}

                          {/* 수강 학과(전공) (교직 모드에만 표시) */}
                          {isTeaching && (
                            <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.major || undefined}>{course.major || '—'}</td>
                          )}

                          {/* 수강인원 (온라인 모드에만 표시) */}
                          {isOnline && (
                            <td className="px-2 py-2 text-sm text-slate-600 text-center whitespace-nowrap">{course.capacity || '—'}</td>
                          )}

                          {/* 주관 (온라인 모드에만 표시) */}
                          {isOnline && (
                            <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.organizer || undefined}>{course.organizer || '—'}</td>
                          )}

                          {/* 회원대학 (온라인 모드에만 표시) */}
                          {isOnline && (
                            <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.partnerUniversity || undefined}>{course.partnerUniversity || '—'}</td>
                          )}

                          {/* 비고 (교선, 교직, 온라인 모드에 표시) */}
                          {(isElective || isTeaching || isOnline) && (
                            <td className="px-2 py-2 text-sm text-slate-600 text-center truncate" title={course.note || undefined}>{course.note || ''}</td>
                          )}
                        </>
                      )}
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
      </div>
    </div>
  )
}
