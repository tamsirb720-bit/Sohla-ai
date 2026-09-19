import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  moduleName: string;
  onReset?: () => void;
  onNavigateHome?: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ModuleErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ControlCenter Module Error in ${this.props.moduleName}]:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4 max-w-3xl mx-auto my-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Unable to load {this.props.moduleName}
              </h3>
              <p className="text-xs text-stone-500">
                A localized runtime error occurred in this module. The rest of the Control Center remains unaffected.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px] text-rose-700 overflow-x-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry / Reload Data</span>
            </button>

            {this.props.onNavigateHome && (
              <button
                onClick={this.props.onNavigateHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Return to Command Center</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
