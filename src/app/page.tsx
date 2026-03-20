"use client";

import { useState, useEffect, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import DynamicRenderer from "./components/DynamicRenderer";
import ChatFlyout from "./components/ChatFlyout";
import Header from "./components/Header";
import { useUser } from "./contexts/UserContext";

// Helper to get language from filename
function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    tsx: "tsx",
    ts: "typescript",
    jsx: "jsx",
    js: "javascript",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
  };
  return langMap[ext || ""] || "typescript";
}

export default function Home() {
  const { user, isLoading: isUserLoading } = useUser();
  const [code, setCode] = useState<string>("");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [entrypoint, setEntrypoint] = useState<string>("index.html");
  const [selectedFile, setSelectedFile] = useState<string>("index.html");
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [version, setVersion] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState<string>("");
  const [showHowTo, setShowHowTo] = useState(false);

  // Fetch sample name on mount
  useEffect(() => {
    fetch("/api/schema")
      .then((res) => res.json())
      .then((data) => setSampleName(data.sample || ""))
      .catch(() => {});
  }, []);

  // Load code when user changes
  useEffect(() => {
    if (user?.id) {
      loadCode(user.id);
    }
  }, [user?.id]);

  // Listen for user switch event to reload code
  useEffect(() => {
    const handleUserSwitched = (event: CustomEvent<{ userId: string }>) => {
      const userId = event.detail?.userId;
      if (userId) {
        setIsLoading(true);
        loadCode(userId);
      }
    };

    window.addEventListener("user-switched", handleUserSwitched as EventListener);
    return () => window.removeEventListener("user-switched", handleUserSwitched as EventListener);
  }, []);

  // Listen for code updates from chat
  useEffect(() => {
    const handleCodeUpdate = (event: CustomEvent<{ code: string }>) => {
      const newCode = event.detail.code;
      setCode(newCode);
      // Also update files state for the entrypoint
      setFiles(prev => ({ ...prev, [entrypoint]: newCode }));
      if (user?.id) {
        saveCode(newCode, user.id);
      }
    };

    window.addEventListener("dynamic-code-update", handleCodeUpdate as EventListener);
    return () => {
      window.removeEventListener("dynamic-code-update", handleCodeUpdate as EventListener);
    };
  }, [user?.id, entrypoint]);

  const loadCode = async (userId: string) => {
    try {
      const response = await fetch(`/api/code?userId=${userId}&all=true`);
      const data = await response.json();
      // Set all files
      setFiles(data.files || {});
      setEntrypoint(data.entrypoint || "index.tsx");
      setSelectedFile(data.entrypoint || "index.tsx");
      // Set code to entrypoint content for DynamicRenderer
      const entrypointCode = data.files?.[data.entrypoint] || "";
      setCode(entrypointCode);
      setVersion(data.version || 0);
    } catch (err) {
      console.error("Failed to load code:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCode = async (newCode: string, userId: string) => {
    try {
      const response = await fetch(`/api/code?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode }),
      });
      const data = await response.json();
      if (data.success) {
        setVersion(data.version);
      }
    } catch (err) {
      console.error("Failed to save code:", err);
    }
  };

  const resetCode = async () => {
    if (!confirm("Reset to default code? This will lose your changes.")) return;
    if (!user?.id) return;
    
    try {
      await fetch(`/api/code?userId=${user.id}`, { method: "DELETE" });
      await loadCode(user.id);
      setLastError(null);
      // Clear chat session and close chat
      window.dispatchEvent(new CustomEvent("clear-chat-session"));
      setIsChatOpen(false);
    } catch (err) {
      console.error("Failed to reset code:", err);
    }
  };

  const handleCompileError = useCallback((error: string) => {
    setLastError(error);
  }, []);

  const handleCompileSuccess = useCallback(() => {
    setLastError(null);
  }, []);

  if (isLoading || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header
        sampleName={sampleName}
        version={version}
        showHowTo={showHowTo}
        setShowHowTo={setShowHowTo}
        showCode={showCode}
        setShowCode={setShowCode}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        onReset={resetCode}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className={`grid gap-6 ${showCode ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Dynamic UI */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-[600px]">
            <DynamicRenderer
              code={code}
              onError={handleCompileError}
              onSuccess={handleCompileSuccess}
            />
          </div>

          {/* Code Panel */}
          {showCode && (
            <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col">
              {/* File Tabs */}
              <div className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto">
                {Object.keys(files).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setSelectedFile(filename)}
                    className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                      selectedFile === filename
                        ? "text-blue-400 border-blue-400 bg-gray-900"
                        : "text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {filename === entrypoint && (
                        <span className="text-xs text-green-400" title="Entrypoint">●</span>
                      )}
                      {filename}
                    </span>
                  </button>
                ))}
                {lastError && (
                  <span className="ml-auto px-3 text-xs text-red-400">Has errors</span>
                )}
              </div>
              {/* Code Content */}
              <div className="overflow-auto flex-1 max-h-[560px]">
                <SyntaxHighlighter
                  language={getLanguageFromFilename(selectedFile)}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: "transparent",
                    fontSize: "0.875rem",
                  }}
                  showLineNumbers
                  lineNumberStyle={{ color: "#6b7280", minWidth: "2.5em" }}
                >
                  {files[selectedFile] || "// No content"}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chat Flyout */}
      <ChatFlyout isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
