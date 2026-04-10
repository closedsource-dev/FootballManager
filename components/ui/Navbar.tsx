"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrency, CURRENCY_SYMBOLS, type Currency } from "@/lib/currencyContext";
import { useTheme } from "@/lib/themeContext";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetAllUserData } from "@/lib/resetData";

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

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  async function handleResetData() {
    setResetting(true);
    try {
      await resetAllUserData();
      setShowResetConfirm(false);
      // Force a full page reload to clear all cached data
      window.location.reload();
    } catch (error) {
      alert("Failed to reset data: " + (error as Error).message);
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

        {/* Sign out */}
        {user && (
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-800 dark:bg-green-700 hover:bg-green-600 text-green-200 hover:text-white transition-colors"
          >
            Sign out
          </button>
        )}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Reset All Data?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This will permanently delete all your players, games, payments, and goals. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
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
    </nav>
  );
}
