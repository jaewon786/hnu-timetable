import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // 필요시 로깅 추가
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">오류가 발생했습니다</h1>
            <p className="text-sm text-slate-500 mb-1">{this.state.error?.message ?? '알 수 없는 오류가 발생했습니다.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
