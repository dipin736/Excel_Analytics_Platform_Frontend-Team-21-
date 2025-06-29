import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onReset={() => this.setState({ hasError: false, error: null, errorInfo: null })}
      />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onReset}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FiHome className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Error Details (Development)
            </summary>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error:</strong> {error.toString()}
              </div>
              {errorInfo && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary; 