"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import ChatMessage, { Message } from "./ChatMessage";
import ChatInput, { ImageAttachment } from "./ChatInput";
import { useUser } from "../contexts/UserContext";

const STORAGE_KEY = "chat-messages";

/**
 * Extract code from <dynamic-code> tags in the response
 */
function extractDynamicCode(content: string): string | null {
  const match = content.match(/<dynamic-code>([\s\S]*?)<\/dynamic-code>/);
  return match ? match[1].trim() : null;
}

/**
 * Dispatch code update event for DynamicRenderer
 */
function dispatchCodeUpdate(code: string) {
  const event = new CustomEvent("dynamic-code-update", {
    detail: { code },
  });
  window.dispatchEvent(event);
}

interface ChatFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatFlyout({ isOpen, onClose }: ChatFlyoutProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>("");
  const [flyoutWidth, setFlyoutWidth] = useState(384); // 384px = w-96
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Check if we're on the dynamic page (home or /dynamic)
  const isDynamicMode = pathname === "/" || pathname === "/dynamic";

  // Min and max width constraints
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 800;

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setFlyoutWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Prevent text selection while resizing
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
  }, [isResizing]);

  // Load current code when in dynamic mode or user changes
  useEffect(() => {
    if (isDynamicMode && user?.id) {
      fetch(`/api/code?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => setCurrentCode(data.code || ""))
        .catch((err) => console.error("Failed to load code:", err));
    }
  }, [isDynamicMode, user?.id]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[];
        // Validate and fix message IDs - check for duplicates or empty IDs
        const seenIds = new Set<string>();
        const fixedMessages = parsed.map((msg, index) => {
          let id = msg.id;
          // Fix empty or duplicate IDs
          if (!id || id === "msg-" || id === "tools-" || seenIds.has(id)) {
            id = `migrated-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
          }
          seenIds.add(id);
          return { ...msg, id };
        });
        setMessages(fixedMessages);
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isHydrated]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen for clear chat session event (triggered by user switch)
  useEffect(() => {
    const handleExternalClear = async () => {
      // Clear local state
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);

      // Reset server-side session
      try {
        await fetch("/api/chat", {
          method: "DELETE",
        });
      } catch (e) {
        console.error("Failed to reset session:", e);
      }
    };

    window.addEventListener("clear-chat-session", handleExternalClear);
    return () => window.removeEventListener("clear-chat-session", handleExternalClear);
  }, []);

  const handleClearSession = async () => {
    // Clear local state
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);

    // Reset server-side session
    try {
      await fetch("/api/chat", {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to reset session:", e);
    }
  };

  const handleSend = async (content: string, images: ImageAttachment[]) => {
    // Build display content - show that images were attached
    const displayContent = images.length > 0 
      ? `${content}${content ? '\n\n' : ''}[${images.length} image${images.length > 1 ? 's' : ''} attached]`
      : content;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent,
      // Store image previews for display in chat
      imageAttachments: images.map(img => img.preview),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role === "event" ? "assistant" : m.role,
            content: m.content,
          })),
          dynamicMode: isDynamicMode,
          currentCode: isDynamicMode ? currentCode : undefined,
          // Send image data to API
          images: images.map(img => ({
            base64: img.base64,
            mimeType: img.mimeType,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }

      const data = await response.json();
      const assistantContent = data.content || "";
      
      // Check for dynamic code in the response
      const dynamicCode = extractDynamicCode(assistantContent);
      if (dynamicCode && isDynamicMode) {
        setCurrentCode(dynamicCode);
        dispatchCodeUpdate(dynamicCode);
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Flyout Panel */}
      <div
        ref={flyoutRef}
        style={{ width: flyoutWidth }}
        className={`fixed right-0 top-0 z-50 flex h-full flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-blue-500/50 active:bg-blue-500"
        />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Copilot Chat
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearSession}
              disabled={isLoading}
              title="New session"
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex h-full items-center justify-center text-center text-zinc-500 dark:text-zinc-400">
              <p>Start a conversation with Copilot</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div className="bg-zinc-200 dark:bg-zinc-700 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="animate-bounce text-zinc-600 dark:text-zinc-300">●</span>
                      <span className="animate-bounce text-zinc-600 dark:text-zinc-300" style={{ animationDelay: "0.1s" }}>●</span>
                      <span className="animate-bounce text-zinc-600 dark:text-zinc-300" style={{ animationDelay: "0.2s" }}>●</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </>
  );
}
