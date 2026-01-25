import React from 'react';
import logger from '../services/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Always log to our logger (handles dev/prod appropriately)
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error ? this.state.error.toString() : '';
      const errorStack = this.state.errorInfo?.componentStack || '';
      const showDetails = Boolean(errorMessage || errorStack);

      return (
        <div className="status-page">
          <div className="status-card status-error">
            <div className="status-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.6" />
              </svg>
            </div>

            <h1 className="status-title">Ops! Algo deu errado</h1>
            <p className="status-subtitle">
              Tente atualizar a página. Se o problema continuar, volte mais tarde.
            </p>

            {showDetails && (
              <pre className="status-error-details">
                {errorMessage}
                {errorStack}
              </pre>
            )}

            <div className="status-actions">
              <button
                type="button"
                onClick={this.handleReload}
                className="status-button status-button-primary"
              >
                Recarregar
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="status-button status-button-secondary"
              >
                Ir para início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
