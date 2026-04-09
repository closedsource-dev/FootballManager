// General utility helpers

/**
 * Formats a number as currency (USD by default)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Returns a readable label for a player position
 */
export function positionLabel(position: string): string {
  const labels: Record<string, string> = {
    GK: "Goalkeeper",
    DEF: "Defender",
    MID: "Midfielder",
    FWD: "Forward",
  };
  return labels[position] ?? position;
}
