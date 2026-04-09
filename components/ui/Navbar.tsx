"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrency, CURRENCY_SYMBOLS, type Currency } from "@/lib/currencyContext";
import { useTheme } from "@/lib/themeContext";

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
      </div>
    </nav>
  );
}
