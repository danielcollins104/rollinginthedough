/**
 * Error Boundary — friendly error UI.
 *
 * Wraps the React tree and catches render-time errors. When
 * something goes wrong, shows the player:
 *   - A clear headline ("Something went wrong")
 *   - A short explanation ("Reloading usually fixes it")
 *   - Two actions: Reload, Copy error details
 *   - A collapsed <details> with the technical stack for
 *     developers (the player never sees it by default)
 *
 * The previous version of this component dumped the raw
 * error.stack to the player in a <pre> block, which was
 * alarming and meaningless. The new version puts the
 * technical detail behind a click. The same
 * `localStorage.ritd_last_error` key is still written so
 * the "Copy error details" button can give support a
 * single string to work with.
 *
 * The component remains a class because React error
 * boundaries must be classes (no hook equivalent as of
 * React 19). There's no functional alternative without
 * moving the boundary out of the tree.
 *
 * See docs/PHASE_5_STATUS.md Gap E.
 */
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Copy, Check } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copyState: "idle" | "copied" | "failed";
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copyState: "idle",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Console + localStorage so support can find the error
    // after the user has reloaded (the React tree is gone).
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    try {
      localStorage.setItem(
        "ritd_last_error",
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo?.componentStack ?? null,
          time: Date.now(),
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        })
      );
    } catch {
      // localStorage may be full or disabled — that's fine,
      // the in-memory error in state is still enough to copy.
    }
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleCopy = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const payload = [
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `Message: ${error?.message ?? "(no message)"}`,
      "",
      "Stack:",
      error?.stack ?? "(no stack)",
      "",
      "Component stack:",
      errorInfo?.componentStack ?? "(no component stack)",
    ].join("\n");
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(payload);
      } else {
        // Fallback for older browsers / non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = payload;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      this.setState({ copyState: "copied" });
      // Reset the "Copied!" indicator after a short delay so
      // the user sees the confirmation but it doesn't linger.
      window.setTimeout(() => {
        this.setState({ copyState: "idle" });
      }, 2000);
    } catch {
      this.setState({ copyState: "failed" });
      window.setTimeout(() => {
        this.setState({ copyState: "idle" });
      }, 2000);
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, copyState } = this.state;

    return (
      <div
        className="flex items-center justify-center min-h-screen p-8"
        style={{
          background: "linear-gradient(135deg, #050510, #0a0a1a)",
          color: "#F5E6C8",
          fontFamily: "'Playfair Display', serif",
        }}
      >
        <div
          className="flex flex-col items-center w-full max-w-xl p-8 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
            border: "1px solid rgba(212, 175, 55, 0.35)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          <AlertTriangle
            size={48}
            style={{ color: "#D4AF37", marginBottom: "1.5rem" }}
          />

          <h1
            className="text-2xl font-bold mb-3 text-center"
            style={{ color: "#D4AF37" }}
          >
            Something went wrong
          </h1>

          <p
            className="text-base text-center mb-6 leading-relaxed"
            style={{ color: "rgba(245, 230, 200, 0.85)" }}
          >
            We hit an unexpected error. Reloading the page usually
            fixes it. If it keeps happening, please copy the
            error details below and send them to support.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full sm:w-auto">
            <button
              onClick={this.handleReload}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium",
                "transition-all active:scale-95"
              )}
              style={{
                background: "linear-gradient(135deg, #1a3a1a, #2a5a2a)",
                border: "1px solid rgba(76, 175, 80, 0.5)",
                color: "#90EE90",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
            <button
              onClick={this.handleCopy}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium",
                "transition-all active:scale-95"
              )}
              style={{
                background:
                  copyState === "copied"
                    ? "linear-gradient(135deg, #1a3a1a, #2a5a2a)"
                    : "linear-gradient(135deg, #3a2a1a, #5a3a2a)",
                border:
                  copyState === "copied"
                    ? "1px solid rgba(76, 175, 80, 0.5)"
                    : "1px solid rgba(212, 175, 55, 0.5)",
                color: copyState === "copied" ? "#90EE90" : "#D4AF37",
                cursor: "pointer",
              }}
              aria-label="Copy error details to clipboard"
            >
              {copyState === "copied" ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : copyState === "failed" ? (
                <>
                  <Copy size={16} />
                  Copy failed
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy error details
                </>
              )}
            </button>
          </div>

          <details
            className="w-full text-sm"
            style={{ color: "rgba(245, 230, 200, 0.6)" }}
          >
            <summary
              className="cursor-pointer text-center py-2 select-none"
              style={{ color: "rgba(212, 175, 55, 0.7)" }}
            >
              Technical details
            </summary>
            <pre
              className="mt-3 p-3 rounded text-xs overflow-auto"
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(212, 175, 55, 0.15)",
                color: "rgba(245, 230, 200, 0.7)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error?.stack ?? "(no stack trace available)"}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
