export interface Rank {
  name: string;
  image: string;       // path relative to /public
  minGames: number;
  maxGames: number | null;
  color: string;       // tailwind text color for label
}

export const RANKS: Rank[] = [
  { name: "Bronze",   image: "/bronze.png",   minGames: 0,   maxGames: 4,    color: "text-amber-700"  },
  { name: "Silver",   image: "/silver.png",   minGames: 5,   maxGames: 14,   color: "text-gray-500"   },
  { name: "Gold",     image: "/gold.png",     minGames: 15,  maxGames: 34,   color: "text-yellow-500" },
  { name: "Platinum", image: "/platinum.png", minGames: 35,  maxGames: 59,   color: "text-cyan-500"   },
  { name: "Emerald",  image: "/emerald.png",  minGames: 60,  maxGames: 99,   color: "text-emerald-600"},
  { name: "Diamond",  image: "/diamond.png",  minGames: 100, maxGames: null, color: "text-blue-500"   },
];

export function getRank(totalGames: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalGames >= RANKS[i].minGames) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(totalGames: number): Rank | null {
  const current = getRank(totalGames);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}
