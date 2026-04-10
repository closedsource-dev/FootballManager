"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentWithPlayer } from "@/types";
import { getPayments } from "@/lib/payments";
import PaymentHistory from "@/components/payments/PaymentHistory";

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const p = await getPayments();
      setPayments(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Complete transaction history</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm border dark:border-gray-600 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading transactions...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && <PaymentHistory payments={payments} />}
    </div>
  );
}
