import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  // Explicitly declare props to satisfy strict TypeScript environments
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('nexus_autosave');
      localStorage.removeItem('nexus_saved_streams');
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    } catch (e) {
      console.error("Reset failed", e);
    }
  };

  handleReload = () => {
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full bg-[#171717] border border-red-900/50 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            
            <h1 className="text-xl font-bold mb-2">System Failure</h1>
            <p className="text-gray-400 text-sm mb-6">
              The NexusStream engine encountered a critical error. This is usually caused by corrupted local data.
            </p>

            <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-hidden">
               <code className="text-[10px] text-red-400 font-mono break-all">
                 {this.state.error?.message || 'Unknown Error'}
               </code>
            </div>

            <div className="space-y-3">
              <button 
                onClick={this.handleReload}
                className="w-full py-3 bg-[#262626] hover:bg-[#404040] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={16} /> Try Reloading
              </button>

              <button 
                onClick={this.handleReset}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> Factory Reset (Clear Data)
              </button>
            </div>
            
            <p className="text-[10px] text-gray-600 mt-4">
               Warning: Factory Reset will clear your saved workflows.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}