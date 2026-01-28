"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ChatToggleButton from "./ChatToggleButton";

export default function ChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Don't render on /dynamic page - it has its own ChatFlyout
  if (pathname === "/dynamic") {
    return null;
  }

  return (
    <>
      <ChatToggleButton onClick={() => setIsOpen(true)} isOpen={isOpen} />
      
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Flyout Panel with iframe */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-96 flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-2 top-2 z-10 rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
        
        {/* Chat iframe - isolated from main page refreshes */}
        {isOpen && (
          <iframe
            src="/chat"
            className="h-full w-full border-0"
            title="Copilot Chat"
          />
        )}
      </div>
    </>
  );
}
