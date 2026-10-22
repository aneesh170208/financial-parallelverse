import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from '@/components/common/ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected interface error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page-container">
          <div className="mx-auto max-w-2xl pt-16">
            <ErrorState
              message="An unexpected interface error interrupted this view. Your saved data is safe in the local database."
              onRetry={() => window.location.reload()}
            />
            <p className="mt-4 text-center text-[10px] text-faint">
              If this keeps happening, restart the app with <code className="font-mono text-muted">npm run dev</code> and
              the FastAPI server.
            </p>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
