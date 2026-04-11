"use client";

import { useState, useEffect, useRef } from "react";
import { getSharedWithMe } from "@/lib/sharing";
import { useWorkspace } from "@/lib/workspaceContext";
import type { SharedWithMe } from "@/types";

export default function SharedWithMeDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [shares, setShares] = useState<SharedWithMe[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { visitWorkspace } = useWorkspace();

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadShares() {
    setLoading(true);
    try {
      const data = await getSharedWithMe();
      setShares(data);
    } catch (err) {
      console.error("Failed to load shared workspaces:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleVisit(share: SharedWithMe) {
    visitWorkspace(share.owner_id, share.role);
    setIsOpen(false);
    // Reload the page to fetch new workspace data
    window.location.reload();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-800 dark:bg-green-700 hover:bg-green-600 transition-colors flex items-center gap-1"
        title="Workspaces shared with me"
      >
        📂 Shared ({shares.length})
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 py-2 z-50">
          <div className="px-3 py-2 border-b dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Shared with Me</p>
          </div>

          {loading ? (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : shares.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">No shared workspaces</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  {share.owner_avatar_url ? (
                    <img
                      src={share.owner_avatar_url}
                      alt={share.owner_username || "User"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-semibold">
                      {share.owner_username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {share.owner_username || "No username"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {share.role}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVisit(share)}
                    className="text-xs px-3 py-1 rounded-md bg-green-700 text-white hover:bg-green-800 transition-colors"
                  >
                    Visit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
