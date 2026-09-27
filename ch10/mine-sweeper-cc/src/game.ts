import { DIFFICULTIES } from "./types";
import type { Board, Cell, Difficulty } from "./types";

export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

const NEIGHBOR_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function neighborsOf(row: number, col: number, rows: number, cols: number) {
  return NEIGHBOR_OFFSETS.map(([dr, dc]) => [row + dr, col + dc]).filter(
    ([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols
  );
}

/** 첫 클릭 위치와 그 주변 칸은 지뢰를 피해서 배치한다(첫 클릭이 항상 넓게 열리도록). */
export function placeMines(
  board: Board,
  mines: number,
  safeRow: number,
  safeCol: number
): Board {
  const rows = board.length;
  const cols = board[0].length;
  const safeZone = [[safeRow, safeCol], ...neighborsOf(safeRow, safeCol, rows, cols)];
  const forbidden = new Set(safeZone.map(([r, c]) => `${r},${c}`));

  const candidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!forbidden.has(`${r},${c}`)) candidates.push([r, c]);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const next = board.map((row) => row.map((cell) => ({ ...cell })));
  for (const [r, c] of candidates.slice(0, mines)) {
    next[r][c].isMine = true;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].isMine) continue;
      next[r][c].adjacentMines = neighborsOf(r, c, rows, cols).filter(
        ([nr, nc]) => next[nr][nc].isMine
      ).length;
    }
  }
  return next;
}

/** 클릭한 칸을 공개하고, 인접 지뢰가 0이면 주변을 연쇄적으로 공개한다(flood fill). */
export function revealCell(board: Board, row: number, col: number): Board {
  const rows = board.length;
  const cols = board[0].length;
  const next = board.map((r) => r.map((c) => ({ ...c })));

  const stack: [number, number][] = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const cell = next[r][c];
    if (cell.isRevealed || cell.isFlagged) continue;
    cell.isRevealed = true;
    if (cell.adjacentMines === 0 && !cell.isMine) {
      stack.push(...(neighborsOf(r, c, rows, cols) as [number, number][]));
    }
  }
  return next;
}

export function revealAllMines(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
  );
}

export function toggleFlag(board: Board, row: number, col: number): Board {
  const next = board.map((r) => r.map((c) => ({ ...c })));
  const cell = next[row][col];
  if (!cell.isRevealed) cell.isFlagged = !cell.isFlagged;
  return next;
}

export function checkWin(board: Board): boolean {
  return board.every((row) =>
    row.every((cell) => cell.isMine || cell.isRevealed)
  );
}

export function countFlags(board: Board): number {
  return board.reduce(
    (sum, row) => sum + row.filter((cell) => cell.isFlagged).length,
    0
  );
}

const BASE_SCORE: Record<Difficulty, number> = {
  easy: 1000,
  medium: 2000,
  hard: 3000,
};

const PENALTY_PER_SECOND: Record<Difficulty, number> = {
  easy: 5,
  medium: 8,
  hard: 12,
};

/** 난이도가 높을수록 기본 점수가 높고, 시간이 오래 걸릴수록 감점된다. */
export function calculateScore(
  difficulty: Difficulty,
  elapsedSeconds: number
): number {
  const raw =
    BASE_SCORE[difficulty] - elapsedSeconds * PENALTY_PER_SECOND[difficulty];
  return Math.max(100, Math.round(raw));
}

export function getDifficultyConfig(difficulty: Difficulty) {
  return DIFFICULTIES[difficulty];
}
