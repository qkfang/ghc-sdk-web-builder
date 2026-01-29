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
    <div className="my-2 rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-left transition-colors"
      >
        <span className="flex items-center gap-2 text-xs text-zinc-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="font-mono">{language}</span>
          <span className="text-zinc-500">• {lineCount} lines</span>
        </span>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
  imageAttachments?: string[]; // Data URLs for image previews
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

  // Don't render empty assistant messages
  if (!isUser && !isEvent && !message.content?.trim()) {
    return null;
  }

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
        className={`rounded-lg px-4 py-2 ${
          isUser
            ? "max-w-[80%] bg-blue-600 text-white"
            : "w-full bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
        }`}
      >
        {isUser ? (
          <div>
            {message.imageAttachments && message.imageAttachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {message.imageAttachments.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Attached image ${idx + 1}`}
                    className="max-h-32 rounded-lg border border-blue-400/50"
                  />
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>
        ) : (
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
