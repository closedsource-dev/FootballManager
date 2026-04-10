"use client";

import { useState, useMemo } from "react";
import type { PaymentWithPlayer, PaymentType } from "@/types";
import { useCurrency } from "@/lib/currencyContext";

interface PaymentHistoryProps {
  payments: PaymentWithPlayer[];
  limit?: number;
  onViewAll?: () => void;
}

const typeBadge: Record<PaymentType, string> = {
  add_money: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  remove_money: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const typeLabel: Record<PaymentType, string> = {
  add_money: "Added",
  remove_money: "Removed",
};

type TimeFrame = "all" | "ytd" | "1year" | "1month" | "custom";
type SortBy = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTimeFrameDates(timeFrame: TimeFrame): { start: Date | null; end: Date | null } {
  const now = new Date();
  const end = now;
  
  switch (timeFrame) {
    case "ytd": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
    case "1year": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { start, end };
    }
    case "1month": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { start, end };
    }
    case "all":
    default:
      return { start: null, end: null };
  }
}

export default function PaymentHistory({ payments, limit, onViewAll }: PaymentHistoryProps) {
  const { fmt } = useCurrency();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [filterType, setFilterType] = useState<"all" | PaymentType>("all");

  const filteredAndSorted = useMemo(() => {
    let result = [...payments];

    // Filter by type
    if (filterType !== "all") {
      result = result.filter(p => p.type === filterType);
    }

    // Filter by date range
    if (timeFrame === "custom" && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      result = result.filter(p => {
        const date = new Date(p.paid_at);
        return date >= start && date <= end;
      });
    } else if (timeFrame !== "all") {
      const { start, end } = getTimeFrameDates(timeFrame);
      if (start && end) {
        result = result.filter(p => {
          const date = new Date(p.paid_at);
          return date >= start && date <= end;
        });
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime();
        case "date-asc":
          return new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime();
        case "amount-desc":
          return Number(b.amount) - Number(a.amount);
        case "amount-asc":
          return Number(a.amount) - Number(b.amount);
        default:
          return 0;
      }
    });

    return result;
  }, [payments, timeFrame, customStart, customEnd, sortBy, filterType]);

  const displayedPayments = limit ? filteredAndSorted.slice(0, limit) : filteredAndSorted;
  const hasMore = limit && filteredAndSorted.length > limit;

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters - only show if not limited */}
      {!limit && (
        <div className="flex flex-wrap gap-3 items-end">
          {/* Time Frame */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time Period</label>
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">All Time</option>
              <option value="ytd">Year to Date</option>
              <option value="1year">Last 12 Months</option>
              <option value="1month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {timeFrame === "custom" && (
            <>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd || new Date().toISOString().split('T')[0]}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </>
          )}

          {/* Type Filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | PaymentType)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">All Types</option>
              <option value="add_money">Added</option>
              <option value="remove_money">Removed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High-Low)</option>
              <option value="amount-asc">Amount (Low-High)</option>
            </select>
          </div>
        </div>
      )}

      {/* Results count */}
      {!limit && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {filteredAndSorted.length} of {payments.length} transactions
        </p>
      )}

      {/* Transaction List */}
      {displayedPayments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
            {limit ? "No recent transactions." : "No transactions match your filters."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 divide-y dark:divide-gray-700">
          {displayedPayments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[payment.type]}`}>
                  {typeLabel[payment.type]}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {payment.player_name || payment.category_name || "General fund"} · {formatDate(payment.paid_at)}
                  {payment.description ? ` · ${payment.description}` : ""}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${payment.type === "add_money" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {payment.type === "add_money" ? "+" : "−"}{fmt(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* View All button */}
      {hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
        >
          View all {filteredAndSorted.length} transactions →
        </button>
      )}
    </div>
  );
}
