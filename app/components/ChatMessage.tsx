"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface ToolExecution {
  id: string;
  name: string;
  status: "running" | "complete";
  arguments?: Record<string, unknown>;
  result?: string;
  success?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "event";
  content: string;
  eventType?: string;
  toolExecutions?: ToolExecution[];
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

function ToolExecutionItem({ tool }: { tool: ToolExecution }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = tool.arguments || tool.result;

  return (
    <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-xs text-left ${
          hasDetails ? "cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" : "cursor-default"
        }`}
      >
        {tool.status === "running" ? (
          <span className="animate-spin text-blue-500">⚙</span>
        ) : tool.success === false ? (
          <span className="text-red-500">✗</span>
        ) : (
          <span className="text-green-500">✓</span>
        )}
        <span className="font-mono text-zinc-700 dark:text-zinc-300 flex-1">
          {tool.name}
        </span>
        {tool.status === "running" && (
          <span className="text-zinc-500 dark:text-zinc-400">running...</span>
        )}
        {hasDetails && (
          <svg
            className={`h-4 w-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {isExpanded && hasDetails && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs space-y-2">
          {tool.arguments && Object.keys(tool.arguments).length > 0 && (
            <div>
              <div className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Arguments:</div>
              <pre className="bg-zinc-200 dark:bg-zinc-900 rounded p-2 overflow-x-auto text-zinc-700 dark:text-zinc-300">
                {JSON.stringify(tool.arguments, null, 2)}
              </pre>
            </div>
          )}
          {tool.result && (
            <div>
              <div className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Result:</div>
              <pre className="bg-zinc-200 dark:bg-zinc-900 rounded p-2 overflow-x-auto text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-48">
                {tool.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isEvent = message.role === "event";

  // Render tool execution events
  if (isEvent && message.toolExecutions && message.toolExecutions.length > 0) {
    return (
      <div className="mb-3 flex justify-start">
        <div className="max-w-[85%] space-y-2 w-full">
          {message.toolExecutions.map((tool) => (
            <ToolExecutionItem key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    );
  }

  // Render thinking/processing events
  if (isEvent && message.eventType === "thinking") {
    return (
      <div className="mb-3 flex justify-start">
        <div className="flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-xs dark:bg-purple-900/30">
          <span className="animate-pulse text-purple-500">💭</span>
          <span className="text-purple-700 dark:text-purple-300">
            {message.content || "Thinking..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              components={{
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;
                  const codeString = String(children).replace(/\n$/, "");
                  
                  return isInline ? (
                    <code className="rounded bg-zinc-300 px-1 py-0.5 dark:bg-zinc-600 text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        padding: "0.75rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  );
                },
                pre: ({ children }) => <>{children}</>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-zinc-500" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
