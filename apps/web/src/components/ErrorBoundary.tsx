import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-card">
            <span className="error-boundary-icon" aria-hidden="true">
              <Icon name="shield" size={26} />
            </span>
            <h1>حدث خطأ غير متوقع</h1>
            <p>تعذر عرض هذه الشاشة. يمكنك إعادة المحاولة، أو تسجيل الخروج ثم الدخول مجددًا.</p>
            <pre className="error-boundary-detail">{this.state.error.message}</pre>
            <div className="error-boundary-actions">
              <button type="button" className="button button-primary" onClick={this.handleReset}>
                إعادة المحاولة
              </button>
              <button type="button" className="button" onClick={() => window.location.reload()}>
                إعادة تحميل الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
