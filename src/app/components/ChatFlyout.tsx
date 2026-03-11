"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import ChatMessage, { Message, ToolExecution } from "./ChatMessage";
import ChatInput, { ImageAttachment } from "./ChatInput";
import { CopilotIcon } from "./CopilotIcon";
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

    // Track tool executions for this request
    const toolExecutions: Map<string, ToolExecution> = new Map();
    let toolEventMessageId: string | null = null;
    
    // Single streaming assistant message
    const streamingMessageId = `response-${Date.now()}`;
    let streamingContent = "";
    let reasoningContent = "";
    let currentStage: "starting" | "planning" | "working" | "complete" = "starting";

    // Create initial streaming message in starting state
    setMessages((prev) => [...prev, {
      id: streamingMessageId,
      role: "assistant",
      content: "",
      stage: "starting",
      isStreaming: true,
    }]);

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

      // Handle SSE streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case "tool.start":
                // Add or update tool execution
                toolExecutions.set(data.toolId, {
                  id: data.toolId,
                  name: data.toolName,
                  status: "running",
                  arguments: data.arguments,
                  startTime: new Date().toISOString(),
                });
                
                // Create or update the tool event message (separate from response)
                if (!toolEventMessageId) {
                  toolEventMessageId = `tools-${Date.now()}`;
                  // Insert tool message before the streaming response
                  setMessages((prev) => {
                    const streamingIdx = prev.findIndex(m => m.id === streamingMessageId);
                    if (streamingIdx > 0) {
                      const before = prev.slice(0, streamingIdx);
                      const after = prev.slice(streamingIdx);
                      return [
                        ...before,
                        {
                          id: toolEventMessageId!,
                          role: "event" as const,
                          content: "",
                          toolExecutions: Array.from(toolExecutions.values()),
                        },
                        ...after,
                      ];
                    }
                    return prev;
                  });
                } else {
                  setMessages((prev) => 
                    prev.map(m => m.id === toolEventMessageId 
                      ? { ...m, toolExecutions: Array.from(toolExecutions.values()) }
                      : m
                    )
                  );
                }
                break;
                
              case "tool.complete":
                // Update tool execution status
                const tool = toolExecutions.get(data.toolId);
                if (tool) {
                  tool.status = "complete";
                  tool.success = data.success;
                  tool.result = data.result;
                  tool.endTime = new Date().toISOString();
                  
                  setMessages((prev) => 
                    prev.map(m => m.id === toolEventMessageId
                      ? { ...m, toolExecutions: Array.from(toolExecutions.values()) }
                      : m
                    )
                  );
                }
                break;
              
              case "reasoning":
                // Stream reasoning content - update stage to planning
                reasoningContent += data.content || "";
                currentStage = "planning";
                
                // Update the streaming message with reasoning
                setMessages((prev) => 
                  prev.map(m => m.id === streamingMessageId
                    ? { ...m, stage: "planning" as const, reasoning: reasoningContent }
                    : m
                  )
                );
                break;
              
              case "reasoning.complete":
                // Legacy event - no longer used
                break;
              
              case "working":
                // Message generation started - transition to working state
                if (currentStage !== "working") {
                  currentStage = "working";
                  setMessages((prev) => 
                    prev.map(m => m.id === streamingMessageId
                      ? { ...m, stage: "working" as const }
                      : m
                    )
                  );
                }
                break;
              
              case "delta":
                // Content deltas are not streamed anymore - content comes with "done" event
                break;
                
              case "done":
                // Final message received - mark as complete
                const finalContent = data.content || streamingContent;
                
                // Check for dynamic code in the response
                const dynamicCode = extractDynamicCode(finalContent);
                
                // Capture previous code before updating for diff comparison
                const previousCodeSnapshot = dynamicCode && isDynamicMode ? currentCode : undefined;
                
                if (dynamicCode && isDynamicMode) {
                  setCurrentCode(dynamicCode);
                  dispatchCodeUpdate(dynamicCode);
                }

                // Update to complete state with previousCode for diff display
                setMessages((prev) => 
                  prev.map(m => m.id === streamingMessageId
                    ? { 
                        ...m, 
                        content: finalContent,
                        stage: "complete" as const,
                        reasoning: reasoningContent || undefined,
                        isStreaming: false,
                        // Include previousCode only if we have dynamic code and it differs
                        previousCode: previousCodeSnapshot && previousCodeSnapshot !== dynamicCode 
                          ? previousCodeSnapshot 
                          : undefined,
                      }
                    : m
                  )
                );
                break;
                
              case "error":
                throw new Error(data.message || "Unknown error");
            }
          } catch (parseErr) {
            console.error("Failed to parse SSE data:", parseErr, line);
          }
        }
      }
    } catch (error) {
      // Update the streaming message with error content, or create one if it doesn't exist
      const errorContent = `Error: ${error instanceof Error ? error.message : "Failed to get response"}`;
      setMessages((prev) => {
        const hasStreamingMsg = prev.some(m => m.id === streamingMessageId);
        if (hasStreamingMsg) {
          return prev.map(m => m.id === streamingMessageId
            ? { ...m, content: errorContent, stage: "complete" as const, isStreaming: false }
            : m
          );
        } else {
          return [...prev, {
            id: streamingMessageId,
            role: "assistant" as const,
            content: errorContent,
            stage: "complete" as const,
            isStreaming: false,
          }];
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Flyout Panel - positioned below header */}
      <div
        ref={flyoutRef}
        style={{ width: flyoutWidth }}
        className={`fixed right-0 top-[80px] z-50 flex h-[calc(100vh-77px)] flex-col bg-slate-800 border-l border-t border-slate-600/50 shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-green-500/50 active:bg-green-500"
        />
        
        {/* Minimal Header - h-8 (32px) to match main content py-8 top padding */}
        <div className="flex items-center justify-between bg-slate-900 px-4 h-8">
          <div className="flex items-center gap-2">
            <CopilotIcon className="w-4 h-4 text-green-400" />
            <h2 className="text-xs font-medium text-gray-200">
              Copilot Chat
            </h2>
          </div>
          <button
            onClick={handleClearSession}
            disabled={isLoading}
            title="Start new session"
            className="text-xs px-2 py-0.5 rounded text-gray-400 hover:text-gray-200 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            New Session
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <CopilotIcon className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm">Describe how you&apos;d like to customize the UI</p>
              <p className="text-xs text-gray-500 mt-2">Try: &quot;Add a dark mode toggle&quot; or &quot;Make the buttons rounded&quot;</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
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
