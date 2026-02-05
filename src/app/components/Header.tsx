"use client";

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
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Dynamic UI Demo
              </h1>
              {sampleName && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  {sampleName}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chat with Copilot to customize this UI • Version {version}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showHowTo
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              }`}
            >
              How to Use
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <button
              onClick={() => setShowCode(!showCode)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showCode
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {showCode ? "Hide Code" : "Show Code"}
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isChatOpen
                  ? "bg-green-600 text-white"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <CopilotIcon className="w-4 h-4" />
              {isChatOpen ? "Close Chat" : "Customize with Copilot"}
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <UserProfile />
          </div>
        </div>

        {/* How to Use - Expandable Section */}
        {showHowTo && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• Click <strong>&quot;Chat with Copilot&quot;</strong> above to open the chat panel</li>
              <li>• Ask Copilot to modify the UI (e.g., &quot;Make the header blue&quot;, &quot;Add a priority field&quot;)</li>
              <li>• Copilot will generate new code and apply it instantly</li>
              <li>• Use <strong>&quot;Show Code&quot;</strong> to see the current source</li>
              <li>• Use <strong>&quot;Reset&quot;</strong> to go back to the default UI</li>
              <li>• You can also paste images into the chat for Copilot to analyze</li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
