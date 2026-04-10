"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [rlsEnabled, setRlsEnabled] = useState<any[]>([]);

  useEffect(() => {
    async function debug() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Get payments (should be filtered by RLS)
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("id, amount, type, user_id");
      setPayments(paymentsData || []);

      // Get players (should be filtered by RLS)
      const { data: playersData } = await supabase
        .from("players")
        .select("id, name, user_id");
      setPlayers(playersData || []);

      // Check RLS status (this might fail due to permissions)
      const { data: rlsData } = await supabase
        .rpc('check_rls_status')
        .select();
      setRlsEnabled(rlsData || []);
    }
    debug();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>

      <div className="space-y-6">
        {/* Current User */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
          <h2 className="font-bold mb-2">Current User ID</h2>
          <p className="font-mono text-sm">{userId || "Not logged in"}</p>
        </div>

        {/* Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
          <h2 className="font-bold mb-2">Payments ({payments.length})</h2>
          {payments.length === 0 ? (
            <p className="text-gray-500 text-sm">No payments found</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="text-sm font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div>ID: {p.id}</div>
                  <div>Amount: {p.amount}</div>
                  <div>Type: {p.type}</div>
                  <div className={p.user_id === userId ? "text-green-600" : "text-red-600"}>
                    User ID: {p.user_id} {p.user_id === userId ? "✓ (yours)" : "✗ (not yours!)"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Players */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
          <h2 className="font-bold mb-2">Players ({players.length})</h2>
          {players.length === 0 ? (
            <p className="text-gray-500 text-sm">No players found</p>
          ) : (
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.id} className="text-sm font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div>Name: {p.name}</div>
                  <div className={p.user_id === userId ? "text-green-600" : "text-red-600"}>
                    User ID: {p.user_id} {p.user_id === userId ? "✓ (yours)" : "✗ (not yours!)"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h2 className="font-bold mb-2 text-yellow-800 dark:text-yellow-300">What to check:</h2>
          <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-400">
            <li>• If you see payments/players with "not yours!" - RLS is NOT working</li>
            <li>• All items should show "✓ (yours)" if RLS is properly configured</li>
            <li>• If RLS is not working, run the SQL migration in Supabase</li>
            <li>• See TEST_USER_ISOLATION.md for detailed instructions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
