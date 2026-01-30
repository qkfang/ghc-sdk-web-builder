"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Extract and replace <dynamic-code> tags with markdown code blocks
 * so they get proper syntax highlighting
 */
function preprocessDynamicCode(content: string): string {
  return content.replace(
    /<dynamic-code>([\s\S]*?)<\/dynamic-code>/g,
    (_, code) => `\n\`\`\`tsx\n${code.trim()}\n\`\`\`\n`
  );
}

/**
 * Collapsible code block component
 */
function CollapsibleCodeBlock({ 
  code, 
  language 
}: { 
  code: string; 
  language: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineCount = code.split("\n").length;

  return (
    <div className="my-2 rounded-md overflow-hidden border border-slate-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 text-left transition-colors"
      >
        <span className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="font-mono">{language}</span>
          <span className="text-gray-500">• {lineCount} lines</span>
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "0.75rem",
            borderRadius: 0,
            fontSize: "0.75rem",
            maxHeight: "400px",
          }}
          showLineNumbers
          lineNumberStyle={{ color: "#6b7280", minWidth: "2em", paddingRight: "1em" }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
}

/**
 * Collapsible section for reasoning/thinking content
 */
function CollapsibleSection({ 
  title, 
  content,
  defaultExpanded = false
}: { 
  title: string; 
  content: string;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const lineCount = content.split("\n").length;

  return (
    <div className="mb-3 rounded-md overflow-hidden border border-slate-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 text-left transition-colors"
      >
        <span className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>{title}</span>
          <span className="text-gray-500">• {lineCount} lines</span>
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-3 py-2 bg-slate-900/50 text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
}

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

// Response stages for streaming
export type ResponseStage = "starting" | "planning" | "working" | "complete";

export interface Message {
  id: string;
  role: "user" | "assistant" | "event";
  content: string;
  eventType?: string;
  toolExecutions?: ToolExecution[];
  isStreaming?: boolean;
  imageAttachments?: string[]; // Data URLs for image previews
  // Streaming response fields
  stage?: ResponseStage;
  reasoning?: string;
}

interface ChatMessageProps {
  message: Message;
}

function ToolExecutionItem({ tool }: { tool: ToolExecution }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = tool.arguments || tool.result;

  return (
    <div className="rounded-lg bg-slate-700 overflow-hidden">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-xs text-left ${
          hasDetails ? "cursor-pointer hover:bg-slate-600" : "cursor-default"
        }`}
      >
        {tool.status === "running" ? (
          <svg className="w-4 h-4 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : tool.success === false ? (
          <span className="text-red-400">✗</span>
        ) : (
          <span className="text-green-400">✓</span>
        )}
        <span className="font-mono text-gray-200 flex-1">
          {tool.name}
        </span>
        {tool.status === "running" && (
          <span className="text-gray-400">running...</span>
        )}
        {hasDetails && (
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {isExpanded && hasDetails && (
        <div className="border-t border-slate-600 px-3 py-2 text-xs space-y-2">
          {tool.arguments && Object.keys(tool.arguments).length > 0 && (
            <div>
              <div className="font-semibold text-gray-400 mb-1">Arguments:</div>
              <pre className="bg-slate-900 rounded p-2 overflow-x-auto text-gray-300">
                {JSON.stringify(tool.arguments, null, 2)}
              </pre>
            </div>
          )}
          {tool.result && (
            <div>
              <div className="font-semibold text-gray-400 mb-1">Result:</div>
              <pre className="bg-slate-900 rounded p-2 overflow-x-auto text-gray-300 whitespace-pre-wrap max-h-48">
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

  // Don't render empty assistant messages (unless they have a stage - streaming)
  if (!isUser && !isEvent && !message.content?.trim() && !message.stage) {
    return null;
  }

  // Render tool execution events (these stay separate)
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

  // Skip old-style thinking events (now handled in streaming response)
  if (isEvent && (message.eventType === "thinking" || message.eventType === "thinking-complete")) {
    return null;
  }

  // User messages
  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] bg-green-600 text-white rounded-lg px-4 py-2">
          {message.imageAttachments && message.imageAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {message.imageAttachments.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Attached image ${idx + 1}`}
                  className="max-h-32 rounded-lg border border-green-400/50"
                />
              ))}
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant messages (streaming or complete)
  return (
    <div className="flex justify-start mb-3">
      <div className="w-full bg-slate-700 text-gray-100 rounded-lg px-4 py-3">
        {/* Stage indicator */}
        {message.stage && message.stage !== "complete" && (
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>
              {message.stage === "starting" && "Starting"}
              {message.stage === "planning" && "Planning"}
              {message.stage === "working" && "Working on it"}
            </span>
          </div>
        )}
        
        {message.stage === "complete" && (
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
            <span>Complete</span>
          </div>
        )}

        {/* Reasoning section - expandable */}
        {message.reasoning && message.reasoning.trim() && (
          <CollapsibleSection 
            title="Reasoning" 
            content={message.reasoning} 
            defaultExpanded={false}
          />
        )}

        {/* Main content with markdown */}
        {message.content && message.content.trim() && (
          <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
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
                    <CollapsibleCodeBlock code={codeString} language={match[1]} />
                  );
                },
                pre: ({ children }) => <>{children}</>,
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>
                ),
                p: ({ children }) => (
                  <p className="my-2">{children}</p>
                ),
              }}
            >
              {preprocessDynamicCode(message.content)}
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
