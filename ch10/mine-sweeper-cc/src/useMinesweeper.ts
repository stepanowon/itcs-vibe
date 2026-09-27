import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateScore,
  checkWin,
  countFlags,
  createEmptyBoard,
  getDifficultyConfig,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
} from "./game";
import { addScore, getTopScores } from "./storage";
import type { Board, Difficulty, GameStatus, ScoreEntry } from "./types";

export function useMinesweeper(initialDifficulty: Difficulty = "easy") {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const config = getDifficultyConfig(difficulty);
  const [board, setBoard] = useState<Board>(() =>
    createEmptyBoard(config.rows, config.cols)
  );
  const [status, setStatus] = useState<GameStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [topScores, setTopScores] = useState<ScoreEntry[]>(getTopScores);
  const minesPlacedRef = useRef(false);

  useEffect(() => {
    if (status !== "playing") return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const reset = useCallback((nextDifficulty: Difficulty = difficulty) => {
    const nextConfig = getDifficultyConfig(nextDifficulty);
    setDifficulty(nextDifficulty);
    setBoard(createEmptyBoard(nextConfig.rows, nextConfig.cols));
    setStatus("idle");
    setElapsedSeconds(0);
    minesPlacedRef.current = false;
  }, [difficulty]);

  const reveal = useCallback(
    (row: number, col: number) => {
      if (status === "won" || status === "lost") return;

      const isFirstClick = !minesPlacedRef.current;
      if (isFirstClick) {
        minesPlacedRef.current = true;
        setStatus("playing");
      }

      setBoard((prevBoard) => {
        const current = isFirstClick
          ? placeMines(prevBoard, config.mines, row, col)
          : prevBoard;
        const cell = current[row][col];
        if (cell.isRevealed || cell.isFlagged) return current;

        if (cell.isMine) {
          setStatus("lost");
          return revealAllMines(current);
        }

        const revealed = revealCell(current, row, col);
        if (checkWin(revealed)) {
          setStatus("won");
        }
        return revealed;
      });
    },
    [config.mines, status]
  );

  const flag = useCallback(
    (row: number, col: number) => {
      if (status !== "playing" && status !== "idle") return;
      setBoard((prev) => toggleFlag(prev, row, col));
    },
    [status]
  );

  useEffect(() => {
    if (status !== "won") return;
    const score = calculateScore(difficulty, elapsedSeconds);
    const updated = addScore({
      score,
      difficulty,
      elapsedSeconds,
      date: new Date().toISOString(),
    });
    setTopScores(updated);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    board,
    config,
    difficulty,
    status,
    elapsedSeconds,
    minesRemaining: config.mines - countFlags(board),
    topScores,
    reset,
    reveal,
    flag,
  };
}
