import type { Cell, DifficultyConfig, DifficultyKey, GameStatus, ScoreEntry } from './types';

export const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  easy: {
    key: 'easy',
    label: '하',
    rows: 9,
    cols: 9,
    mines: 10,
    scoreMultiplier: 1,
  },
  medium: {
    key: 'medium',
    label: '중',
    rows: 16,
    cols: 16,
    mines: 40,
    scoreMultiplier: 1.8,
  },
  hard: {
    key: 'hard',
    label: '상',
    rows: 16,
    cols: 30,
    mines: 99,
    scoreMultiplier: 3.2,
  },
};

const ADJACENT_STEPS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      adjacentMines: 0,
      isRevealed: false,
      isFlagged: false,
    })),
  );
}

function inBounds(board: Cell[][], row: number, col: number) {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

function cloneBoard(board: Cell[][]) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function getNeighbors(board: Cell[][], row: number, col: number) {
  return ADJACENT_STEPS.map(([dr, dc]) => ({ row: row + dr, col: col + dc })).filter((pos) =>
    inBounds(board, pos.row, pos.col),
  );
}

export function placeMines(
  board: Cell[][],
  mineCount: number,
  safeRow: number,
  safeCol: number,
): Cell[][] {
  const next = cloneBoard(board);
  const candidates: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < next.length; row += 1) {
    for (let col = 0; col < next[0].length; col += 1) {
      const isSafeZone = Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1;
      if (!isSafeZone) {
        candidates.push({ row, col });
      }
    }
  }

  const shuffled = candidates.sort(() => Math.random() - 0.5);
  shuffled.slice(0, mineCount).forEach(({ row, col }) => {
    next[row][col].isMine = true;
  });

  for (let row = 0; row < next.length; row += 1) {
    for (let col = 0; col < next[0].length; col += 1) {
      if (next[row][col].isMine) {
        continue;
      }
      next[row][col].adjacentMines = getNeighbors(next, row, col).filter(
        ({ row: r, col: c }) => next[r][c].isMine,
      ).length;
    }
  }

  return next;
}

export function revealCell(board: Cell[][], row: number, col: number) {
  const next = cloneBoard(board);
  const target = next[row][col];

  if (target.isFlagged || target.isRevealed) {
    return next;
  }

  const queue = [{ row, col }];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }
    const cell = next[current.row][current.col];
    if (cell.isFlagged || cell.isRevealed) {
      continue;
    }
    cell.isRevealed = true;
    if (cell.adjacentMines !== 0 || cell.isMine) {
      continue;
    }
    getNeighbors(next, current.row, current.col).forEach((neighbor) => {
      const neighborCell = next[neighbor.row][neighbor.col];
      if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
        queue.push(neighbor);
      }
    });
  }

  return next;
}

export function toggleFlag(board: Cell[][], row: number, col: number) {
  const next = cloneBoard(board);
  const cell = next[row][col];
  if (cell.isRevealed) {
    return next;
  }
  cell.isFlagged = !cell.isFlagged;
  return next;
}

export function revealAllMines(board: Cell[][]) {
  return board.map((row) =>
    row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell)),
  );
}

export function revealAllCells(board: Cell[][]) {
  return board.map((row) => row.map((cell) => ({ ...cell, isRevealed: true })));
}

export function countRevealedSafeCells(board: Cell[][]) {
  return board.flat().filter((cell) => cell.isRevealed && !cell.isMine).length;
}

export function countCorrectFlags(board: Cell[][]) {
  return board.flat().filter((cell) => cell.isFlagged && cell.isMine).length;
}

export function countFlags(board: Cell[][]) {
  return board.flat().filter((cell) => cell.isFlagged).length;
}

export function isWin(board: Cell[][], mineCount: number) {
  const revealedSafe = board.flat().filter((cell) => cell.isRevealed && !cell.isMine).length;
  return revealedSafe === board.length * board[0].length - mineCount;
}

export function getScore(entry: {
  difficulty: DifficultyConfig;
  elapsedSeconds: number;
  revealedCells: number;
  correctFlags: number;
  status: GameStatus;
}) {
  if (entry.status !== 'won') {
    return 0;
  }

  const totalCells = entry.difficulty.rows * entry.difficulty.cols;
  const base = totalCells * 8 + entry.difficulty.mines * 140;
  const timePenalty = entry.elapsedSeconds * (10 + entry.difficulty.mines * 0.6);
  const revealBonus = entry.revealedCells * 3;
  const flagBonus = entry.correctFlags * 20;
  const rawScore = (base - timePenalty + revealBonus + flagBonus) * entry.difficulty.scoreMultiplier;

  return Math.max(0, Math.round(rawScore));
}

export function createScoreEntry(params: {
  difficulty: DifficultyConfig;
  elapsedSeconds: number;
  revealedCells: number;
  flaggedCells: number;
  correctFlags: number;
  status: GameStatus;
}): ScoreEntry {
  return {
    id: crypto.randomUUID(),
    difficulty: params.difficulty.key,
    difficultyLabel: params.difficulty.label,
    result: params.status === 'won' ? 'won' : 'lost',
    score: getScore(params),
    elapsedSeconds: params.elapsedSeconds,
    revealedCells: params.revealedCells,
    flaggedCells: params.flaggedCells,
    correctFlags: params.correctFlags,
    completedAt: new Date().toISOString(),
  };
}
