import { Component, type PropsWithChildren, type ReactNode } from "react";
import { Button } from "@workspace/ui/components/button";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-destructive">Oops!</h1>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="wrap-break-words text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={resetErrorBoundary} className="w-full">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Props extends PropsWithChildren {
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// React 19 way of doing things
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

// Route-specific error boundary for TanStack Router
export function RouteErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold text-destructive">Route Error</h1>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    </div>
  );
}
