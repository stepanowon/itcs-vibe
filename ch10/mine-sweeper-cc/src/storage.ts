import type { ScoreEntry } from "./types";

const STORAGE_KEY = "minesweeper-scores";
const TOP_N = 5;

export function getTopScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

export function addScore(entry: ScoreEntry): ScoreEntry[] {
  const updated = [...getTopScores(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
