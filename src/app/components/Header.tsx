"use client";

import { useState, useRef, useEffect } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (isFullScreen) return null;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-1.5">
        <div className="flex items-center justify-between">
          {/* Left: hamburger + title */}
          <div className="flex items-center gap-2">
            {/* Hamburger menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Menu"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={() => { setShowHowTo(!showHowTo); setMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      showHowTo
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {showHowTo ? "✓ " : ""}How to Use
                  </button>
                  <button
                    onClick={() => { setShowCode(!showCode); setMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      showCode
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {showCode ? "✓ Hide Code" : "Show Code"}
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button
                    onClick={() => { onReset(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

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

          {/* Right: gallery, fullscreen, copilot, user */}
          <div className="flex items-center gap-2">
            <Link
              href="/gallery"
              className="px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
            >
              Gallery
            </Link>
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
