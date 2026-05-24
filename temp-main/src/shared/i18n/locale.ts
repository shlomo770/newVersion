/** Sort strings for Hebrew UI lists. */
export function sortHebrew(a: string, b: string): number {
  return a.localeCompare(b, 'he');
}
