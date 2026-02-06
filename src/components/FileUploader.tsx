import { type DragEvent, useState, useCallback } from 'react'

const ALLOWED_EXTENSIONS = ['.xlsx', '.xlsm', '.csv']

const STATUS_COLORS: Record<string, string> = {
  uploading: 'var(--accent)',
  success:   'var(--success)',
  error:     'var(--error)',
}

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError]   = useState<string | null>(null)
  // TODO: Implement file upload functionality
  const uploadFile = (_file: File) => { console.log('File upload not implemented') }
  const uploadStatus: { status: 'idle' | 'uploading' | 'success' | 'error'; message: string } = { 
    status: 'idle', 
    message: '' 
  }

  const handleFile = useCallback((file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('지원하지 않는 파일 형식입니다 (.xlsx, .xlsm, .csv만 가능)')
      return
    }
    setFileError(null)
    uploadFile(file)
  }, [uploadFile])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ALLOWED_EXTENSIONS.join(',')
    input.onchange = () => {
      if (input.files?.[0]) handleFile(input.files[0])
    }
    input.click()
  }, [handleFile])

  const isUploading = uploadStatus.status === 'uploading'

  return (
    <div className="w-full max-w-md">
      {/* drop-zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="수강편람 파일 업로드 영역. 클릭하거나 파일을 드래그하여 업로드하세요"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
        className="cursor-pointer rounded-xl p-12 text-center transition-all duration-200"
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
          backgroundColor: isDragging ? '#eef2ff' : 'var(--card)',
        }}
      >
        {/* 아이콘 영역 */}
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#eef2ff' }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: 'var(--primary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 16.5V9.5m0 0l-3 3m3-3l3 3M6.5 19.5a4.5 4.5 0 01-.88-8.903A5.5 5.5 0 1115.9 6L16 6a5 5 0 011 9.9"
            />
          </svg>
        </div>

        <p className="text-base font-semibold text-slate-700">
          {isUploading ? '파싱 중...' : '수강편람 파일을 드래그하거나 클릭하여 업로드'}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          지원 형식: .xlsx, .xlsm, .csv
        </p>
      </div>

      {/* 파일 형식 오류 */}
      {fileError && (
        <p className="mt-3 text-sm text-center font-medium" style={{ color: 'var(--error)' }}>
          {fileError}
        </p>
      )}

      {/* 상태 메시지 (파싱 진행·완료·오류) */}
      {uploadStatus.status !== 'idle' && (
        <p
          className="mt-3 text-sm text-center font-medium"
          style={{ color: STATUS_COLORS[uploadStatus.status] }}
        >
          {uploadStatus.message}
        </p>
      )}
    </div>
  )
}
