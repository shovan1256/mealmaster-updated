import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { clearAppCacheAndReload } from '../utils/cacheManager';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    clearAppCacheAndReload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('mealmaster_clean_current_user_id_v4');
    } catch (e) {
      // ignore
    }
    clearAppCacheAndReload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white">
              অ্যাপ লোড হতে সাময়িক সমস্যা হয়েছে
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              সিস্টেম কোনো অপ্রত্যাশিত ইরর প্রতিরোধ করেছে। পেজটি রিলোড দিন অথবা নতুন করে প্রবেশ করুন।
            </p>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-24 scrollbar-none">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>রিলোড দিন (Reload)</span>
              </button>

              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>হোমে যান</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
