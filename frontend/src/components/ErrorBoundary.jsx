import { Component } from "react";

/**
 * Global Error Boundary for Land Stack GIS
 * Catches unhandled React render errors across all viewports (Mobile BottomSheet, Sidebar, Leaflet Map)
 * and presents a graceful recovery UI instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled component error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 py-8 text-white">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
            {/* Header Icon */}
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
              Application State Recovered
            </h2>
            <p className="mt-1.5 text-xs text-slate-400">
              A temporary rendering conflict occurred in the Cadastral GIS view. Your session and database records are safe.
            </p>

            {this.state.error?.message && (
              <div className="mt-3.5 max-h-24 overflow-y-auto rounded-lg bg-black/40 p-2.5 font-mono text-[11px] text-red-300 border border-red-900/30">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-500 active:scale-95"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.history.pushState(null, "", "/");
                  window.location.reload();
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
