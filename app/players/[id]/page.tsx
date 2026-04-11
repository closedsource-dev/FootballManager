"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import StatsCard from "@/components/players/StatsCard";
import StatEntryForm from "@/components/players/StatEntryForm";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { getPlayers } from "@/lib/players";
import { getAggregatedStats, upsertStats } from "@/lib/stats";
import type { Player, AggregatedStats, PlayerStats } from "@/types";

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // NFR-1: fetch in parallel
      const [players, aggregated] = await Promise.all([
        getPlayers(),
        getAggregatedStats(id),
      ]);
      const found = players.find((p) => p.id === id) ?? null;
      if (!found) {
        setError("Player not found.");
        return;
      }
      setPlayer(found);
      setStats(aggregated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load player data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatSubmit(statData: Omit<PlayerStats, "id" | "player_id" | "user_id">) {
    if (!player) return;
    const updated = await upsertStats(player.id, statData);
    setPlayer(updated);
    const newStats = await getAggregatedStats(player.id);
    setStats(newStats);
    setShowForm(false);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !player || !stats) {
    return <p className="text-red-500 text-sm mt-8">{error ?? "Player not found."}</p>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Player Detail</h1>
      </div>

      <StatsCard player={player} stats={stats} />

      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
      >
        + Log Game Stats
      </button>

      {showForm && (
        <StatEntryForm
          player={player}
          onSubmit={handleStatSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
