"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Currency = "GBP" | "EUR" | "USD";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

interface CurrencyContextValue {
  currency: Currency;
  symbol: string;
  setCurrency: (c: Currency) => void;
  fmt: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  symbol: "$",
  setCurrency: () => {},
  fmt: (n) => `$${n.toFixed(2)}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const saved = localStorage.getItem("fm_currency") as Currency | null;
    if (saved && saved in CURRENCY_SYMBOLS) setCurrencyState(saved);
  }, []);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    localStorage.setItem("fm_currency", c);
  }

  const symbol = CURRENCY_SYMBOLS[currency];

  function fmt(amount: number): string {
    return `${symbol}${Number(amount).toFixed(2)}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
