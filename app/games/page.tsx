"use client";

import { useEffect, useState } from "react";
import { getPlayers, recordGameResult } from "@/lib/players";
import { logGame, getGameLogs, type GameLog } from "@/lib/games";
import { useWorkspace } from "@/lib/workspaceContext";
import GameStats from "./GameStats";
import type { Player } from "@/types";

const positionColors: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800",
  DEF: "bg-blue-100 text-blue-800",
  MID: "bg-purple-100 text-purple-800",
  FWD: "bg-red-100 text-red-800",
};

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];

interface Teams { teamA: Player[]; teamB: Player[]; }

function sortTeam(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const posDiff = POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position);
    return posDiff !== 0 ? posDiff : a.name.localeCompare(b.name);
  });
}

function generateRandomTeams(players: Player[], tolerance: number): Teams | null {
  const byPosition: Record<string, Player[]> = {};
  for (const p of players) {
    if (!byPosition[p.position]) byPosition[p.position] = [];
    byPosition[p.position].push(p);
  }
  for (let attempt = 0; attempt < 2000; attempt++) {
    const teamA: Player[] = [];
    const teamB: Player[] = [];
    for (const group of Object.values(byPosition)) {
      const shuffled = [...group].sort(() => Math.random() - 0.5);
      const half = Math.floor(shuffled.length / 2);
      teamA.push(...shuffled.slice(0, half));
      teamB.push(...shuffled.slice(half, half * 2));
      if (shuffled.length % 2 === 1) {
        const odd = shuffled[shuffled.length - 1];
        if (teamA.length < teamB.length) teamA.push(odd);
        else if (teamB.length < teamA.length) teamB.push(odd);
        else if (Math.random() < 0.5) teamA.push(odd);
        else teamB.push(odd);
      }
    }
    const sumA = teamA.reduce((s, p) => s + p.skill_rating, 0);
    const sumB = teamB.reduce((s, p) => s + p.skill_rating, 0);
    if (Math.abs(sumA - sumB) <= tolerance) return { teamA, teamB };
  }
  return null;
}

function TeamCard({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${positionColors[player.position]}`}>
          {player.position}
        </span>
        <span className="text-sm text-gray-800 dark:text-gray-100">{player.name}</span>
      </div>
      <span className="text-xs font-bold text-green-700 dark:text-green-400">{player.skill_rating}</span>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Game History ──────────────────────────────────────────────────────────────

function GameHistory({ playerMap }: { playerMap: Map<string, Player> }) {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getGameLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;
  if (logs.length === 0) return <p className="text-gray-400 dark:text-gray-500 text-sm">No games played yet.</p>;

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const isOpen = expanded === log.id;
        const teamAPlayers = log.team_a_ids.map((id) => playerMap.get(id)).filter(Boolean) as Player[];
        const teamBPlayers = log.team_b_ids.map((id) => playerMap.get(id)).filter(Boolean) as Player[];
        const sortedA = sortTeam(teamAPlayers);
        const sortedB = sortTeam(teamBPlayers);
        const resultLabel = log.winner === "A" ? "Team A wins" : log.winner === "B" ? "Team B wins" : "Draw";
        const resultColor = log.winner === "draw" ? "text-gray-500 dark:text-gray-400" : "text-green-700 dark:text-green-400";

        return (
          <div key={log.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : log.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {log.score_a} – {log.score_b}
                </span>
                <span className={`text-sm font-medium ${resultColor}`}>{resultLabel}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(log.played_at)}</span>
                <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 grid grid-cols-2 gap-4 border-t dark:border-gray-700 pt-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Team A {log.winner === "A" && <span className="text-green-600 dark:text-green-400">· Winner</span>}
                  </p>
                  <div className="space-y-1">
                    {sortedA.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${positionColors[p.position]}`}>{p.position}</span>
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Team B {log.winner === "B" && <span className="text-green-600 dark:text-green-400">· Winner</span>}
                  </p>
                  <div className="space-y-1">
                    {sortedB.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${positionColors[p.position]}`}>{p.position}</span>
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const { currentWorkspaceRole } = useWorkspace();
  const isViewer = currentWorkspaceRole === "viewer";
  
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"create" | "history" | "stats">("create");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tolerance, setTolerance] = useState(5);
  const [teams, setTeams] = useState<Teams | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [gameDate, setGameDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getPlayers()
      .then((p) => { setAllPlayers(p); setSelected(new Set(p.map((x) => x.id))); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setTeams(null);
    setSubmitted(false);
  }

  function handleGenerate() {
    setGenError(null);
    setSubmitted(false);
    setScoreA("");
    setScoreB("");
    const today = new Date();
    setGameDate(today.toISOString().split('T')[0]);
    const players = allPlayers.filter((p) => selected.has(p.id));
    if (players.length < 2) { setGenError("Select at least 2 players."); return; }
    const result = generateRandomTeams(players, tolerance);
    if (!result) {
      setGenError(`Couldn't split teams within a skill difference of ${tolerance}. Try increasing the tolerance.`);
      return;
    }
    setTeams({ teamA: sortTeam(result.teamA), teamB: sortTeam(result.teamB) });
  }

  async function handleSubmitScore() {
    if (!teams) return;
    const a = parseInt(scoreA, 10);
    const b = parseInt(scoreB, 10);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return;
    setSubmitting(true);
    try {
      const allIds = [...teams.teamA, ...teams.teamB].map((p) => p.id);
      const winner: "A" | "B" | "draw" = a > b ? "A" : b > a ? "B" : "draw";
      const winnerIds = winner === "A" ? teams.teamA.map((p) => p.id) : winner === "B" ? teams.teamB.map((p) => p.id) : [];

      // Convert the date to ISO string with time
      const gameDateISO = new Date(gameDate + 'T12:00:00').toISOString();

      await Promise.all([
        recordGameResult(allIds, winnerIds),
        logGame({
          score_a: a,
          score_b: b,
          team_a_ids: teams.teamA.map((p) => p.id),
          team_b_ids: teams.teamB.map((p) => p.id),
          winner,
          played_at: gameDateISO,
        }),
      ]);

      const updated = await getPlayers();
      setAllPlayers(updated);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPlayers = allPlayers.filter((p) => selected.has(p.id));
  const sumA = teams?.teamA.reduce((s, p) => s + p.skill_rating, 0) ?? 0;
  const sumB = teams?.teamB.reduce((s, p) => s + p.skill_rating, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Games</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6 w-fit">
        {(["create", "history", "stats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t === "create" ? "Create Game" : t === "history" ? "Game History" : "Game Stats"}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading players…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && tab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: settings + player selection */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Skill Tolerance</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Max skill difference: <span className="font-bold text-green-700 dark:text-green-400">{tolerance}</span>
              </p>
              <input type="range" min={0} max={40} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full accent-green-700" />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                <span>0 (exact)</span><span>40 (any)</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Players ({selectedPlayers.length})</p>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(new Set(allPlayers.map((p) => p.id)))} className="text-xs text-green-700 dark:text-green-400 hover:underline">All</button>
                  <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:underline">None</button>
                </div>
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {allPlayers.map((p) => (
                  <button key={p.id} type="button" onClick={() => togglePlayer(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      selected.has(p.id)
                        ? "bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${positionColors[p.position]}`}>{p.position}</span>
                      <span>{p.name}</span>
                    </div>
                    <span className="font-bold text-xs">{p.skill_rating}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={selectedPlayers.length < 2}
              className="w-full bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-40">
              Generate Teams
            </button>
            {genError && <p className="text-red-500 text-xs">{genError}</p>}
          </div>

          {/* Right: teams + score */}
          <div className="lg:col-span-2 space-y-4">
            {teams ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Team A</h2>
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">Skill: {sumA}</span>
                    </div>
                    <div className="space-y-1.5">{teams.teamA.map((p) => <TeamCard key={p.id} player={p} />)}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Team B</h2>
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">Skill: {sumB}</span>
                    </div>
                    <div className="space-y-1.5">{teams.teamB.map((p) => <TeamCard key={p.id} player={p} />)}</div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Skill difference: {Math.abs(sumA - sumB)} · {teams.teamA.length} vs {teams.teamB.length} players
                </p>

                {!submitted ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Record Result</p>
                    
                    {/* Date input */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Game Date</label>
                      <input 
                        type="date" 
                        value={gameDate} 
                        onChange={(e) => setGameDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Team A score</label>
                        <input type="number" min={0} value={scoreA} onChange={(e) => setScoreA(e.target.value)}
                          className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-center font-bold bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="0" />
                      </div>
                      <span className="text-gray-400 font-bold text-lg mt-4">–</span>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Team B score</label>
                        <input type="number" min={0} value={scoreB} onChange={(e) => setScoreB(e.target.value)}
                          className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-center font-bold bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="0" />
                      </div>
                    </div>
                    <button onClick={handleSubmitScore} disabled={submitting || scoreA === "" || scoreB === "" || isViewer}
                      className="w-full mt-4 bg-green-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isViewer ? "Viewers cannot save game results" : "Submit result"}
                    >
                      {submitting ? "Saving…" : "Submit Result"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-5 text-center">
                    <p className="text-green-700 dark:text-green-400 font-semibold text-sm">
                      Result saved — {scoreA} : {scoreB}
                      {parseInt(scoreA) > parseInt(scoreB) ? " · Team A wins" :
                       parseInt(scoreB) > parseInt(scoreA) ? " · Team B wins" : " · Draw"}
                    </p>
                    <button onClick={() => { setTeams(null); setSubmitted(false); setTab("history"); }}
                      className="mt-3 text-xs text-green-700 dark:text-green-400 underline">
                      View in Game History
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                Select players and click "Generate Teams" to start.
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && tab === "history" && (
        <GameHistory playerMap={playerMap} />
      )}

      {!loading && tab === "stats" && (
        <GameStats players={allPlayers} />
      )}
    </div>
  );
}
