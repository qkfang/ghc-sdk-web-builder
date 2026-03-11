"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, User } from "../contexts/UserContext";

// Random name generator for new users
const RANDOM_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
  "Iris", "Jack", "Kate", "Leo", "Maya", "Noah", "Olivia", "Paul",
  "Quinn", "Ruby", "Sam", "Tara", "Uma", "Victor", "Wendy", "Xavier", "Yara", "Zack"
];

function getRandomName(): string {
  const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const suffix = Math.floor(Math.random() * 1000);
  return `${name}${suffix}`;
}

// Dispatch event to clear chat session
function dispatchClearChat() {
  window.dispatchEvent(new CustomEvent("clear-chat-session"));
}

export default function UserProfile() {
  const { user, isLoading, setUserName, switchUser, createUser, listUsers } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsEditing(false);
        setIsSwitchUserOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Load users when switch user submenu opens
  useEffect(() => {
    if (isSwitchUserOpen) {
      setIsLoadingUsers(true);
      listUsers()
        .then((users) => setAllUsers(users))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isSwitchUserOpen, listUsers]);

  const handleStartEdit = () => {
    setEditName(user?.name || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;

    setIsSaving(true);
    try {
      await setUserName(editName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToUser = async (userId: string) => {
    try {
      await switchUser(userId);
      dispatchClearChat();
      setIsDropdownOpen(false);
      setIsSwitchUserOpen(false);
      // Trigger a code reload with the new user ID
      window.dispatchEvent(new CustomEvent("user-switched", { detail: { userId } }));
    } catch (error) {
      console.error("Failed to switch user:", error);
    }
  };

  const handleCreateNewUser = async () => {
    try {
      const randomName = getRandomName();
      const newUser = await createUser(randomName);
      dispatchClearChat();
      setIsDropdownOpen(false);
      setIsSwitchUserOpen(false);
      // Trigger a code reload with the new user ID
      if (newUser?.id) {
        window.dispatchEvent(new CustomEvent("user-switched", { detail: { userId: newUser.id } }));
      }
    } catch (error) {
      console.error("Failed to create new user:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
          {user?.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {user?.name || "Guest"}
        </span>
        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Current User
            </p>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter name"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editName.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "..." : "Save"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </span>
                <button
                  onClick={handleStartEdit}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* User ID (for debugging/reference) */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{user?.id?.slice(0, 20)}...</code>
            </p>
          </div>

          {/* Actions */}
          <div className="px-2 py-1">
            <button
              onClick={() => {
                handleStartEdit();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Change Name
              </span>
            </button>
            
            {/* Switch User with submenu */}
            <div className="relative">
              <button
                onClick={() => setIsSwitchUserOpen(!isSwitchUserOpen)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Switch User
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isSwitchUserOpen ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              {/* User list submenu */}
              {isSwitchUserOpen && (
                <div className="absolute left-full top-0 ml-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-64 overflow-y-auto">
                  {isLoadingUsers ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                      Loading...
                    </div>
                  ) : (
                    <>
                      {/* New User option */}
                      <button
                        onClick={handleCreateNewUser}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New User
                      </button>
                      
                      {allUsers.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                      )}

                      {/* Existing users */}
                      {allUsers
                        .filter((u) => u.id !== user?.id)
                        .map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleSwitchToUser(u.id)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium">
                              {u.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <span className="truncate">{u.name}</span>
                          </button>
                        ))}
                      
                      {allUsers.filter((u) => u.id !== user?.id).length === 0 && (
                        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                          No other users
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
