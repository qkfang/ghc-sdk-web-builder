"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import ChatMessage, { Message, ToolExecution } from "./ChatMessage";
import ChatInput from "./ChatInput";
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

interface StreamEvent {
  type: string;
  data?: {
    content?: string;
    message?: string;
    message_id?: string;
    turn_id?: string;
    name?: string;
    tool_call_id?: string;
    delta?: string;
    arguments?: Record<string, unknown>;
    result?: string;
    success?: boolean;
    error?: string;
    timestamp?: string;
  };
}

// Track current turn state
interface TurnState {
  messageContent: string;
  messageId: string;
  toolIds: string[];
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
  const [toolExecutions, setToolExecutions] = useState<Map<string, ToolExecution>>(new Map());
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [currentCode, setCurrentCode] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Check if we're on the dynamic page (home or /dynamic)
  const isDynamicMode = pathname === "/" || pathname === "/dynamic";

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
  }, [messages, streamingContent, toolExecutions, scrollToBottom]);

  // Listen for clear chat session event (triggered by user switch)
  useEffect(() => {
    const handleExternalClear = async () => {
      // Clear local state
      setMessages([]);
      setToolExecutions(new Map());
      setStreamingContent("");
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
    setToolExecutions(new Map());
    setStreamingContent("");
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

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setToolExecutions(new Map());
    setStreamingContent("");

    // Track tool executions locally
    const localToolExecutions = new Map<string, ToolExecution>();
    // Track current turn state
    const currentTurn: TurnState = {
      messageContent: "",
      messageId: "",
      toolIds: [],
    };

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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              accumulatedContent = handleStreamEvent(
                event,
                accumulatedContent,
                localToolExecutions,
                currentTurn
              );
            } catch (e) {
              console.error("Failed to parse SSE event:", e);
            }
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setToolExecutions(new Map());
      setStreamingContent("");
    }
  };

  const handleStreamEvent = (
    event: StreamEvent,
    accumulatedContent: string,
    localToolExecutions: Map<string, ToolExecution>,
    currentTurn: TurnState
  ): string => {
    switch (event.type) {
      case "tool.execution_start": {
        const toolId = event.data?.tool_call_id || Date.now().toString();
        const toolName = event.data?.name || "Unknown tool";
        const toolExecution: ToolExecution = {
          id: toolId,
          name: toolName,
          status: "running",
          arguments: event.data?.arguments,
          startTime: event.data?.timestamp,
        };
        localToolExecutions.set(toolId, toolExecution);
        currentTurn.toolIds.push(toolId);
        setToolExecutions((prev) => {
          const newMap = new Map(prev);
          newMap.set(toolId, toolExecution);
          return newMap;
        });
        return accumulatedContent;
      }

      case "tool.execution_complete": {
        const toolId = event.data?.tool_call_id || "";
        const existing = localToolExecutions.get(toolId);
        if (existing) {
          const updated: ToolExecution = {
            ...existing,
            status: "complete",
            success: event.data?.success,
            result: event.data?.result || event.data?.error,
            endTime: event.data?.timestamp,
          };
          localToolExecutions.set(toolId, updated);
          setToolExecutions((prev) => {
            const newMap = new Map(prev);
            newMap.set(toolId, updated);
            return newMap;
          });
        }
        return accumulatedContent;
      }

      case "assistant.message_delta": {
        const delta = event.data?.delta || event.data?.content || "";
        const newContent = accumulatedContent + delta;
        setStreamingContent(newContent);
        return newContent;
      }

      case "assistant.message": {
        // Store the message content for this turn - we'll save it on turn_end
        const content = event.data?.content || accumulatedContent;
        const messageId = event.data?.message_id || Date.now().toString();
        currentTurn.messageContent = content;
        currentTurn.messageId = messageId;
        // Show the content in streaming display
        if (content) {
          setStreamingContent(content);
        }
        return content;
      }

      case "assistant.turn_end": {
        // Save the completed turn (message + tools that came after it)
        if (currentTurn.messageContent) {
          // Check for dynamic code in the message
          const dynamicCode = extractDynamicCode(currentTurn.messageContent);
          if (dynamicCode && isDynamicMode) {
            // Update the code and dispatch event
            setCurrentCode(dynamicCode);
            dispatchCodeUpdate(dynamicCode);
          }
          
          // Get tools for this turn
          const turnTools = currentTurn.toolIds
            .map((id) => localToolExecutions.get(id))
            .filter((t): t is ToolExecution => t !== undefined);
          
          // Ensure we have a unique message ID
          const messageId = currentTurn.messageId || `turn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          
          // Batch save both tool executions and assistant message
          setMessages((prev) => {
            const newMessages = [...prev];
            
            // Add tool executions first
            if (turnTools.length > 0) {
              newMessages.push({
                id: `tools-${messageId}`,
                role: "event",
                content: "",
                toolExecutions: turnTools,
              });
            }
            
            // Add the assistant message
            newMessages.push({
              id: `msg-${messageId}`,
              role: "assistant",
              content: currentTurn.messageContent,
            });
            
            return newMessages;
          });
        }
        
        // Reset for next turn - delay slightly to prevent flash
        currentTurn.messageContent = "";
        currentTurn.messageId = "";
        currentTurn.toolIds = [];
        
        // Use setTimeout to allow React to render saved messages before clearing live display
        setTimeout(() => {
          setStreamingContent("");
          setToolExecutions(new Map());
        }, 50);
        
        return "";
      }

      case "thinking": {
        // Show thinking indicator (handled by loading state)
        return accumulatedContent;
      }

      case "done": {
        // If there's unsaved content (turn_end wasn't received), save it now
        if (currentTurn.messageContent) {
          // Check for dynamic code in the message
          const dynamicCode = extractDynamicCode(currentTurn.messageContent);
          if (dynamicCode && isDynamicMode) {
            setCurrentCode(dynamicCode);
            dispatchCodeUpdate(dynamicCode);
          }
          
          // Generate unique ID for this final message
          const finalId = `final-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          
          const turnTools = currentTurn.toolIds
            .map((id) => localToolExecutions.get(id))
            .filter((t): t is ToolExecution => t !== undefined);
          
          setMessages((prev) => {
            const newMessages = [...prev];
            
            if (turnTools.length > 0) {
              newMessages.push({
                id: `tools-${finalId}`,
                role: "event",
                content: "",
                toolExecutions: turnTools,
              });
            }
            
            newMessages.push({
              id: `msg-${finalId}`,
              role: "assistant",
              content: currentTurn.messageContent,
            });
            
            return newMessages;
          });
        } else if (event.data?.content) {
          // Check for dynamic code in fallback content
          const dynamicCode = extractDynamicCode(event.data.content);
          if (dynamicCode && isDynamicMode) {
            setCurrentCode(dynamicCode);
            dispatchCodeUpdate(dynamicCode);
          }
          
          // Fallback: use content from done event
          const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          setMessages((prev) => [...prev, {
            id: `msg-${fallbackId}`,
            role: "assistant",
            content: event.data!.content!,
          }]);
        }
        
        setTimeout(() => {
          setStreamingContent("");
        }, 50);
        return "";
      }

      case "error": {
        const errorMessage: Message = {
          id: `error-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          role: "assistant",
          content: `Error: ${event.data?.message || "Unknown error"}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return accumulatedContent;
      }

      default:
        return accumulatedContent;
    }
  };

  const toolExecutionsList = Array.from(toolExecutions.values());

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
        className={`fixed right-0 top-0 z-50 flex h-full w-96 flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
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
              {/* Show tool executions */}
              {toolExecutionsList.length > 0 && (
                <ChatMessage
                  message={{
                    id: "tool-executions",
                    role: "event",
                    content: "",
                    toolExecutions: toolExecutionsList,
                  }}
                />
              )}
              {/* Show streaming content */}
              {streamingContent && (
                <ChatMessage
                  message={{
                    id: "streaming",
                    role: "assistant",
                    content: streamingContent,
                    isStreaming: true,
                  }}
                />
              )}
              {isLoading && !streamingContent && toolExecutionsList.length === 0 && (
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
