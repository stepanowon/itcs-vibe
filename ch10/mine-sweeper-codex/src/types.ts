export type DifficultyKey = 'easy' | 'medium' | 'hard';

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  rows: number;
  cols: number;
  mines: number;
  scoreMultiplier: number;
}

export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  adjacentMines: number;
  isRevealed: boolean;
  isFlagged: boolean;
}

export interface ScoreEntry {
  id: string;
  difficulty: DifficultyKey;
  difficultyLabel: string;
  result: 'won' | 'lost';
  score: number;
  elapsedSeconds: number;
  revealedCells: number;
  flaggedCells: number;
  correctFlags: number;
  completedAt: string;
}

export interface SerializedGameState {
  difficulty: DifficultyKey;
  status: GameStatus;
  startedAt: number | null;
  elapsedSeconds: number;
  firstMoveDone: boolean;
  revealedCells: number;
  flagCount: number;
  board: Cell[][];
}
