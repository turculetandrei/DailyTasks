import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** When true, render nothing on error (used to isolate the 3D background). */
  silent?: boolean
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the real error in the console for debugging.
    console.error('[DAILY] Render error:', error, info)
  }

  render() {
    if (this.state.error) {
      if (this.props.silent) return this.props.fallback ?? null
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: '#090909',
            color: '#F0EEE6',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ maxWidth: 640, width: '100%' }}>
            <h1 style={{ color: '#FF4D4D', fontSize: 18, marginBottom: 12 }}>
              Something crashed while rendering
            </h1>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 16,
                fontSize: 12,
                color: '#FF8C42',
                overflow: 'auto',
                maxHeight: '60vh',
              }}
            >
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
