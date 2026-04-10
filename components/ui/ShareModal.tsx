"use client";

import { useState, useEffect } from "react";
import { searchUsersByUsername, getMyWorkspaceShares, shareWorkspace, updateShareRole, removeShare } from "@/lib/sharing";
import type { UserProfile, ShareWithUser, ShareRole } from "@/types";

interface ShareModalProps {
  onClose: () => void;
}

export default function ShareModal({ onClose }: ShareModalProps) {
  const [tab, setTab] = useState<"share" | "manage">("share");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [shares, setShares] = useState<ShareWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadShares();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  async function searchUsers() {
    try {
      const results = await searchUsersByUsername(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  async function loadShares() {
    try {
      const data = await getMyWorkspaceShares();
      setShares(data);
    } catch (err) {
      console.error("Load shares error:", err);
    }
  }

  async function handleShare(userId: string, role: ShareRole) {
    setError("");
    setLoading(true);
    try {
      await shareWorkspace(userId, role);
      await loadShares();
      setSearchTerm("");
      setSearchResults([]);
      setTab("manage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share workspace");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(shareId: string, role: ShareRole) {
    setError("");
    try {
      await updateShareRole(shareId, role);
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRemove(shareId: string) {
    setError("");
    try {
      await removeShare(shareId);
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove share");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Share Workspace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 mx-6 mt-4 rounded-lg">
          <button
            onClick={() => setTab("share")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "share"
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Add People
          </button>
          <button
            onClick={() => setTab("manage")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "manage"
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Manage Access ({shares.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {tab === "share" && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Search for users by username to share your workspace with them.
              </p>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username..."
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 mb-4"
              />

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                            {user.username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {user.username || "No username"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShare(user.id, "viewer")}
                          disabled={loading}
                          className="text-xs px-3 py-1 rounded-lg border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Viewer
                        </button>
                        <button
                          onClick={() => handleShare(user.id, "editor")}
                          disabled={loading}
                          className="text-xs px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50"
                        >
                          Editor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No users found
                </p>
              )}
            </div>
          )}

          {tab === "manage" && (
            <div>
              {shares.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  You haven't shared your workspace with anyone yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {share.shared_with_avatar_url ? (
                          <img
                            src={share.shared_with_avatar_url}
                            alt={share.shared_with_username || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                            {share.shared_with_username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {share.shared_with_username || "No username"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={share.role}
                          onChange={(e) => handleUpdateRole(share.id, e.target.value as ShareRole)}
                          className="text-xs border dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={() => handleRemove(share.id)}
                          className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Viewer:</strong> Can view all data but cannot make changes.
              <br />
              <strong>Editor:</strong> Can view and modify all data (players, payments, games, etc.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
