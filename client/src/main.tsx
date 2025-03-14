import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "remixicon/fonts/remixicon.css";

// Create a custom error handler for the application
const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
  console.error("Application Error:", error);
  console.error("Error Info:", errorInfo);
  
  // Display error message in the DOM
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
        <h2 style="color: #e11d48;">Application Error</h2>
        <p style="margin-bottom: 20px;">${error.message || "An unexpected error occurred."}</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 4px; text-align: left; overflow: auto; max-height: 300px;">
          <code style="white-space: pre-wrap; font-family: monospace; font-size: 14px;">${error.stack || ""}</code>
        </div>
        <button 
          style="margin-top: 20px; background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
          onclick="window.location.reload()"
        >
          Reload Application
        </button>
      </div>
    `;
  }
};

// Create an error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    handleAppError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // The error UI is handled by the handleAppError function
      return null;
    }
    return this.props.children;
  }
}

try {
  // Wait for DOM content to be fully loaded
  const renderApp = () => {
    const rootElement = document.getElementById("root");
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      );
      console.log("React app mounted successfully");
      
      // Remove loading indicator once app is mounted
      const loadingIndicator = document.getElementById("loading-indicator");
      if (loadingIndicator) {
        setTimeout(() => {
          loadingIndicator.style.display = "none";
        }, 1000);
      }
    } else {
      console.error("Failed to find the root element");
    }
  };

  // Check if DOM is already loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderApp);
  } else {
    renderApp();
  }
} catch (error) {
  console.error("Error during application initialization:", error);
  handleAppError(error as Error, { componentStack: "" } as React.ErrorInfo);
}
