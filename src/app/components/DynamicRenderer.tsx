"use client";

import React, { useState, useEffect, useMemo } from "react";
import { compileToComponent } from "../lib/compiler";
import { componentScope } from "../lib/component-scope";

interface DynamicRendererProps {
  code: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  fallback?: React.ReactNode;
}

/**
 * DynamicRenderer - Compiles and renders React components from source code
 * 
 * This component takes TypeScript/JSX source code as a string,
 * compiles it in the browser using Sucrase, and renders the result.
 * 
 * Security: Only components and APIs from componentScope are available.
 */
export default function DynamicRenderer({
  code,
  onError,
  onSuccess,
  fallback,
}: DynamicRendererProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(true);

  // Memoize scope to prevent unnecessary recompilations
  const scope = useMemo(() => componentScope, []);

  useEffect(() => {
    if (!code || code.trim() === "") {
      setComponent(null);
      setError(null);
      setIsCompiling(false);
      return;
    }

    setIsCompiling(true);
    setError(null);

    // Use setTimeout to not block the main thread
    const timeoutId = setTimeout(() => {
      try {
        const result = compileToComponent(code, scope);

        if (result.success && result.Component) {
          setComponent(() => result.Component!);
          setError(null);
          onSuccess?.();
        } else {
          setError(result.error || "Unknown compilation error");
          setComponent(null);
          onError?.(result.error || "Unknown compilation error");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setComponent(null);
        onError?.(errorMessage);
      } finally {
        setIsCompiling(false);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [code, scope, onError, onSuccess]);

  // Show loading state
  if (isCompiling) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Compiling...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
          Compilation Error
        </h3>
        <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
          {error}
        </pre>
        {fallback && (
          <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              Showing fallback UI:
            </p>
            {fallback}
          </div>
        )}
      </div>
    );
  }

  // Show empty state
  if (!Component) {
    return fallback || (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No component to render
      </div>
    );
  }

  // Render the compiled component with error boundary
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
            Runtime Error
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            The component crashed during rendering. Check the console for details.
          </p>
        </div>
      }
    >
      <Component />
    </ErrorBoundary>
  );
}

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[DynamicRenderer] Runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
