import { useEffect } from 'react'
import useAppStore from '../stores/useAppStore.ts'

export default function SemesterSelector() {
  // const semesters       = useAppStore((state) => state.semesters)
  const currentSemester = useAppStore((state) => state.currentSemester)
  // const selectSemester  = useAppStore((state) => state.selectSemester)
  const semesters = [currentSemester]
  const selectSemester = (_id: string) => { /* TODO: implement */ }

  // 학기가 1개면 자동 선택
  useEffect(() => {
    if (semesters.length === 1 && !currentSemester) {
      selectSemester(semesters[0].id)
    }
  }, [semesters, currentSemester, selectSemester])

  if (semesters.length === 0) {
    return <p className="text-sm text-slate-500">학기 데이터가 없습니다.</p>
  }

  if (semesters.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">현재 학기</span>
        <span className="text-sm font-semibold text-slate-800">
          {currentSemester?.label}
        </span>
      </div>
    )
  }

  // 학기가 2개 이상이면 드롭다운
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-slate-500">학기 선택</label>
      <select
        value={currentSemester?.id || ''}
        onChange={(e) => selectSemester(e.target.value)}
        className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700"
      >
        <option value="">학기 선택</option>
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}
