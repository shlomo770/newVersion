import React from 'react';
import { AppButton } from '@shared/ui';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.iconWrap}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className={styles.title}>Something went wrong</h2>

            <p className={styles.message}>
              An unexpected error occurred. Please try refreshing the page.
            </p>

            <div className={styles.actions}>
              <AppButton fullWidth onPointerDown={() => window.location.reload()}>
                Refresh Page
              </AppButton>

              <AppButton
                fullWidth
                variant="secondary"
                onPointerDown={() => this.setState({ hasError: false })}
              >
                Try Again
              </AppButton>
            </div>

            {this.state.error ? (
              <details className={styles.details}>
                <summary className={styles.detailsSummary}>Error Details</summary>
                <pre className={styles.errorPre}>{this.state.error.toString()}</pre>
              </details>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
