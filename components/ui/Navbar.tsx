"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrency, CURRENCY_SYMBOLS, type Currency } from "@/lib/currencyContext";
import { useTheme } from "@/lib/themeContext";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { resetAllUserData } from "@/lib/resetData";
import { getCurrentUserProfile } from "@/lib/sharing";
import ShareModal from "./ShareModal";
import UsernameSetup from "./UsernameSetup";
import SharedWithMeDropdown from "./SharedWithMeDropdown";
import ProfileMenu from "./ProfileMenu";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/players", label: "Players" },
  { href: "/payments", label: "Payments" },
  { href: "/games", label: "Games" },
];

const CURRENCIES = Object.keys(CURRENCY_SYMBOLS) as Currency[];

export default function Navbar() {
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();
  const { dark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [hasUsername, setHasUsername] = useState(true);

  useEffect(() => {
    checkUsername();
  }, [user]);

  async function checkUsername() {
    if (!user) return;
    try {
      const profile = await getCurrentUserProfile();
      if (profile && !profile.username) {
        setShowUsernameSetup(true);
        setHasUsername(false);
      } else if (profile && profile.username) {
        setHasUsername(true);
      }
    } catch (err) {
      // Profiles table might not exist yet, fail silently
      console.error("Failed to check username:", err);
      setHasUsername(false);
    }
  }

  function handleUsernameComplete() {
    setShowUsernameSetup(false);
    setHasUsername(true);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  async function handleResetData() {
    if (!resetPassword) {
      setResetError("Please enter your password");
      return;
    }

    setResetting(true);
    setResetError("");
    
    try {
      // Verify password by attempting to sign in
      const { data, error } = await import("@/lib/supabase").then(m => m.supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: resetPassword,
      }));

      if (error) {
        setResetError("Incorrect password");
        setResetting(false);
        return;
      }

      // Password is correct, proceed with reset
      await resetAllUserData();
      setShowResetConfirm(false);
      setResetPassword("");
      // Force a full page reload to clear all cached data
      window.location.reload();
    } catch (error) {
      setResetError("Failed to reset data: " + (error as Error).message);
      setResetting(false);
    }
  }

  return (
    <nav className="bg-green-700 dark:bg-green-900 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="font-bold text-lg tracking-tight">⚽ FootballManager</span>
        <div className="flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium hover:text-green-200 transition-colors ${
                pathname === link.href ? "underline underline-offset-4" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Share button */}
        {user && hasUsername && (
          <button
            onClick={() => setShowShareModal(true)}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-800 dark:bg-green-700 hover:bg-green-600 transition-colors"
            title="Share workspace"
          >
            👥 Share
          </button>
        )}

        {/* Shared with me dropdown */}
        {user && hasUsername && (
          <SharedWithMeDropdown onSelectWorkspace={(ownerId) => console.log("Switch to workspace:", ownerId)} />
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-800 dark:bg-green-700 hover:bg-green-600 transition-colors"
          title="Toggle dark mode"
        >
          {dark ? "☀️" : "🌙"}
        </button>

        {/* Currency switcher */}
        <div className="flex items-center gap-1 bg-green-800 dark:bg-green-700 rounded-lg p-1">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                currency === c
                  ? "bg-white text-green-800"
                  : "text-green-200 hover:text-white"
              }`}
            >
              {CURRENCY_SYMBOLS[c]} {c}
            </button>
          ))}
        </div>

        {/* Reset data */}
        {user && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-800 dark:bg-red-700 hover:bg-red-600 text-red-200 hover:text-white transition-colors"
            title="Reset all data"
          >
            Reset
          </button>
        )}

        {/* Profile menu */}
        {user && hasUsername && <ProfileMenu onSignOut={handleSignOut} />}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Reset All Data?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This will permanently delete all your players, games, payments, categories, and goals. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Password"
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-600"
                disabled={resetting}
              />
              {resetError && <p className="text-red-500 text-xs mt-2">{resetError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetPassword("");
                  setResetError("");
                }}
                disabled={resetting}
                className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Reset All Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}

      {/* Username setup modal */}
      {showUsernameSetup && <UsernameSetup onComplete={handleUsernameComplete} />}
    </nav>
  );
}
