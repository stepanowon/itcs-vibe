export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: "하 (9x9, 지뢰 10개)" },
  medium: { rows: 16, cols: 16, mines: 40, label: "중 (16x16, 지뢰 40개)" },
  hard: { rows: 16, cols: 30, mines: 99, label: "상 (16x30, 지뢰 99개)" },
};

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type Board = Cell[][];

export type GameStatus = "idle" | "playing" | "won" | "lost";

export interface ScoreEntry {
  score: number;
  difficulty: Difficulty;
  elapsedSeconds: number;
  date: string;
}
