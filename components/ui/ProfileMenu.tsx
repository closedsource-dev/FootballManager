"use client";

import { useState, useEffect, useRef } from "react";
import { getCurrentUserProfile, uploadAvatar } from "@/lib/sharing";
import type { UserProfile } from "@/types";

interface ProfileMenuProps {
  onSignOut: () => void;
}

export default function ProfileMenu({ onSignOut }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadProfile() {
    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
    } catch (err) {
      // Profiles table might not exist yet, fail silently
      console.error("Failed to load profile:", err);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setProfile((prev) => (prev ? { ...prev, avatar_url: url } : null));
    } catch (err) {
      alert("Failed to upload avatar: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (!profile) {
    // Fallback to basic sign out button if profile can't be loaded
    return (
      <button
        onClick={onSignOut}
        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-800 dark:bg-green-700 hover:bg-green-600 text-green-200 hover:text-white transition-colors"
      >
        Sign out
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-green-800 dark:bg-green-700 hover:bg-green-600 transition-colors"
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username || "User"}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
            {profile.username?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <span>{profile.username || "No username"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 py-2 z-50">
          <div className="px-3 py-3 border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || "User"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg font-semibold">
                  {profile.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {profile.username || "No username"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Change Avatar"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="border-t dark:border-gray-700 pt-1">
            <button
              onClick={onSignOut}
              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
