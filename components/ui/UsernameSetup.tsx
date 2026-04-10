"use client";

import { useState } from "react";
import { updateUsername } from "@/lib/sharing";

interface UsernameSetupProps {
  onComplete: () => void;
}

export default function UsernameSetup({ onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedUsername, setSavedUsername] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, hyphens, and underscores");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await updateUsername(username);
      setSavedUsername(username);
      setSuccess(true);
      // Auto-close after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set username");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              All Set!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your username is <span className="font-semibold text-green-600 dark:text-green-400">{savedUsername}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Welcome to the New Update!
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Football Manager now supports sharing your workspace with others. To get started, please choose a username.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              3+ characters, letters, numbers, hyphens, and underscores only
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
