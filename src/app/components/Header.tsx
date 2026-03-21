"use client";

import Link from "next/link";
import { CopilotIcon } from "./CopilotIcon";
import UserProfile from "./UserProfile";

interface HeaderProps {
  sampleName: string | null;
  version: number;
  showHowTo: boolean;
  setShowHowTo: (show: boolean) => void;
  showCode: boolean;
  setShowCode: (show: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  onReset: () => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
}

export default function Header({
  sampleName,
  version,
  showHowTo,
  setShowHowTo,
  showCode,
  setShowCode,
  isChatOpen,
  setIsChatOpen,
  onReset,
  isFullScreen,
  setIsFullScreen,
}: HeaderProps) {
  if (isFullScreen) return null;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
              Startup Idea Builder
            </h1>
            {sampleName && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                {sampleName}
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500">v{version}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/gallery"
              className="px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
            >
              Gallery
            </Link>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showHowTo
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              }`}
            >
              How to Use
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <button
              onClick={() => setShowCode(!showCode)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showCode
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {showCode ? "Hide Code" : "Show Code"}
            </button>
            <button
              onClick={onReset}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setIsFullScreen(true)}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Full screen"
            >
              ⛶
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                isChatOpen
                  ? "bg-green-600 text-white"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <CopilotIcon className="w-3.5 h-3.5" />
              {isChatOpen ? "Close Chat" : "Copilot"}
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <UserProfile />
          </div>
        </div>

        {/* How to Use - Expandable Section */}
        {showHowTo && (
          <div className="mt-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>• Click <strong>&quot;Build with Copilot&quot;</strong> above to open the chat panel</li>
              <li>• Ask Copilot to build or modify your HTML page (e.g., &quot;Add a contact form&quot;, &quot;Make the background dark&quot;)</li>
              <li>• Copilot will generate a complete HTML page and apply it instantly</li>
              <li>• Use <strong>&quot;Show Code&quot;</strong> to see the current HTML source</li>
              <li>• Use <strong>&quot;Reset&quot;</strong> to go back to the default page</li>
              <li>• You can also paste images into the chat for Copilot to analyze</li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
