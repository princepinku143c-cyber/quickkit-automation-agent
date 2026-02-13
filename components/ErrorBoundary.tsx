
import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 [Global Trap] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    // Attempt to recover by reloading
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white font-sans">
          <div className="bg-white text-black p-10 rounded-2xl shadow-2xl text-center max-w-md w-full border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Something went wrong.</h2>
            
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              The application encountered an unexpected error. We've logged this issue.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Try Again
            </button>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
               <p className="text-[10px] text-gray-400 font-mono break-all">
                 Error: {this.state.error?.message || 'Unknown'}
               </p>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
