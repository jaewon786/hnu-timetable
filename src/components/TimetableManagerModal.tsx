import { useEffect, useRef, useState } from 'react'
import useTimetableStore from '../stores/useTimetableStore.ts'
import {
  getSavedTimetables,
  saveTimetableAs,
  deleteSavedTimetable,
  renameSavedTimetable,
  type SavedTimetable,
} from '../utils/storage.ts'

interface Props {
  onClose: () => void
}

export default function TimetableManagerModal({ onClose }: Props) {
  const selectedCourses = useTimetableStore((s) => s.selectedCourses)
  const initFromStorage = useTimetableStore((s) => s.initFromStorage)
  const clearAllCourses = useTimetableStore((s) => s.clearAllCourses)

  const modalRef = useRef<HTMLDivElement>(null)
  const [savedTimetables, setSavedTimetables] = useState<SavedTimetable[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [saveError, setSaveError] = useState('')
  const [newTimetableWarning, setNewTimetableWarning] = useState(false)
  const [pendingLoadTimetable, setPendingLoadTimetable] = useState<SavedTimetable | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // 저장된 시간표 목록 로드
  useEffect(() => {
    setSavedTimetables(getSavedTimetables())
  }, [])

  // 페이드 트랜지션
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Esc 키 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // 새 시간표로 저장
  const handleSaveNew = () => {
    setSaveError('')
    if (!newName.trim()) {
      setSaveError('시간표 이름을 입력해주세요.')
      return
    }
    if (selectedCourses.length === 0) {
      setSaveError('저장할 강의가 없습니다.')
      return
    }

    saveTimetableAs(newName.trim(), selectedCourses)
    setSavedTimetables(getSavedTimetables())
    setNewName('')
    setSaveError('')
  }

  // 현재 시간표가 저장된 상태인지 확인
  const isCurrentTimetableSaved = () => {
    if (selectedCourses.length === 0) return true
    
    // 현재 시간표의 강의 ID 목록
    const currentIds = selectedCourses.map(sc => sc.course.id).sort().join(',')
    
    // 저장된 시간표 중 동일한 것이 있는지 확인
    return savedTimetables.some(saved => {
      const savedIds = saved.selectedCourses.map(sc => sc.course.id).sort().join(',')
      return currentIds === savedIds
    })
  }

  // 시간표 불러오기
  const handleLoad = (timetable: SavedTimetable) => {
    // 현재 시간표가 저장되지 않은 경우에만 경고
    if (selectedCourses.length > 0 && !isCurrentTimetableSaved()) {
      setPendingLoadTimetable(timetable)
      return
    }
    initFromStorage(timetable.selectedCourses)
    onClose()
  }

  // 불러오기 확인
  const confirmLoad = () => {
    if (pendingLoadTimetable) {
      initFromStorage(pendingLoadTimetable.selectedCourses)
      setPendingLoadTimetable(null)
      onClose()
    }
  }

  // 불러오기 취소
  const cancelLoad = () => {
    setPendingLoadTimetable(null)
  }

  // 시간표 삭제
  const handleDelete = (id: string) => {
    setPendingDeleteId(id)
  }

  // 삭제 확인
  const confirmDelete = () => {
    if (pendingDeleteId) {
      deleteSavedTimetable(pendingDeleteId)
      setSavedTimetables(getSavedTimetables())
      setPendingDeleteId(null)
    }
  }

  // 삭제 취소
  const cancelDelete = () => {
    setPendingDeleteId(null)
  }

  // 이름 수정 시작
  const startRename = (timetable: SavedTimetable) => {
    setEditingId(timetable.id)
    setEditingName(timetable.name)
  }

  // 이름 수정 완료
  const finishRename = () => {
    if (editingId && editingName.trim()) {
      renameSavedTimetable(editingId, editingName.trim())
      setSavedTimetables(getSavedTimetables())
    }
    setEditingId(null)
    setEditingName('')
  }

  // 새 시간표 시작
  const handleNewTimetable = () => {
    // 현재 시간표가 저장되지 않은 경우에만 경고
    if (selectedCourses.length > 0 && !isCurrentTimetableSaved()) {
      setNewTimetableWarning(true)
      return
    }
    clearAllCourses()
    onClose()
  }

  // 새 시간표 확인
  const confirmNewTimetable = () => {
    clearAllCourses()
    setNewTimetableWarning(false)
    onClose()
  }

  // 새 시간표 취소
  const cancelNewTimetable = () => {
    setNewTimetableWarning(false)
  }

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timetable-manager-title"
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
          <h2 id="timetable-manager-title" className="text-base sm:text-lg font-bold text-slate-800">
            시간표 관리
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

        {/* 현재 시간표 저장 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">현재 시간표 저장</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setSaveError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSaveNew()}
              placeholder="시간표 이름 (예: 1안, 오전집중형)"
              className="flex-1 px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: saveError ? '#dc2626' : 'var(--border)',
                color: 'var(--text)',
              }}
            />
            <button
              onClick={handleSaveNew}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              저장
            </button>
          </div>
          {saveError ? (
            <p className="text-[11px] text-red-500 mt-1">{saveError}</p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">
              현재 선택된 강의: {selectedCourses.length}개
            </p>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 저장된 시간표 목록 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">저장된 시간표</h3>
            <button
              onClick={handleNewTimetable}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: 'var(--surface)',
                color: '#dc2626',
                border: '1px solid #dc2626',
              }}
            >
              새 시간표
            </button>
          </div>

          {/* 새 시간표 경고 메시지 */}
          {newTimetableWarning && (
            <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-[11px] text-red-600 mb-2">
                현재 시간표가 저장되지 않았습니다. 초기화하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmNewTimetable}
                  className="flex-1 text-xs px-2 py-1 rounded text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  초기화
                </button>
                <button
                  onClick={cancelNewTimetable}
                  className="flex-1 text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 불러오기 경고 메시지 */}
          {pendingLoadTimetable && (
            <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-[11px] text-red-600 mb-2">
                현재 시간표가 저장되지 않았습니다. "{pendingLoadTimetable.name}"을(를) 불러오시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmLoad}
                  className="flex-1 text-xs px-2 py-1 rounded text-white"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  불러오기
                </button>
                <button
                  onClick={cancelLoad}
                  className="flex-1 text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {savedTimetables.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              저장된 시간표가 없습니다
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedTimetables.map(timetable => (
                <div
                  key={timetable.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    {editingId === timetable.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={finishRename}
                        onKeyDown={e => e.key === 'Enter' && finishRename()}
                        autoFocus
                        className="flex-1 px-2 py-1 rounded text-sm border mr-2"
                        style={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      />
                    ) : (
                      <span
                        className="font-medium text-slate-800 cursor-pointer hover:text-blue-600"
                        onClick={() => startRename(timetable)}
                        title="클릭하여 이름 수정"
                      >
                        {timetable.name}
                      </span>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleLoad(timetable)}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                        }}
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => handleDelete(timetable.id)}
                        className="text-xs px-2 py-1 rounded transition-colors text-red-500 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  {/* 삭제 확인 메시지 */}
                  {pendingDeleteId === timetable.id && (
                    <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                      <p className="text-[11px] text-red-600 mb-2">
                        "{timetable.name}" 시간표를 삭제하시겠습니까?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={confirmDelete}
                          className="flex-1 text-xs px-2 py-1 rounded text-white"
                          style={{ backgroundColor: '#dc2626' }}
                        >
                          삭제
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="flex-1 text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{timetable.selectedCourses.length}개 강의</span>
                    <span>•</span>
                    <span>{formatDate(timetable.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 하단 버튼 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
