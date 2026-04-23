import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ParrillaErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[parrilla/error-boundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoBack = () => {
    window.location.href = "/parrillas";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Algo salió mal en la parrilla
            </h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Error inesperado al renderizar la parrilla."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" size="sm" onClick={this.handleRetry}>
                Reintentar
              </Button>
              <Button size="sm" onClick={this.handleGoBack}>
                Volver a parrillas
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
