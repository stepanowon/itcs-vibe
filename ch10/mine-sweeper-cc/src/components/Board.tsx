import type { Board as BoardType } from "../types";

interface BoardProps {
  board: BoardType;
  disabled: boolean;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
}

const NUMBER_COLORS: Record<number, string> = {
  1: "#1976d2",
  2: "#388e3c",
  3: "#d32f2f",
  4: "#7b1fa2",
  5: "#f57c00",
  6: "#0097a7",
  7: "#424242",
  8: "#757575",
};

export function Board({ board, disabled, onReveal, onFlag }: BoardProps) {
  return (
    <div className="board" style={{ gridTemplateColumns: `repeat(${board[0].length}, 1fr)` }}>
      {board.map((row, r) =>
        row.map((cell, c) => {
          const revealedClass = cell.isRevealed ? "cell revealed" : "cell";
          const mineClass = cell.isRevealed && cell.isMine ? " mine" : "";
          return (
            <button
              key={`${r}-${c}`}
              className={revealedClass + mineClass}
              disabled={disabled || cell.isRevealed}
              onClick={() => onReveal(r, c)}
              onContextMenu={(e) => {
                e.preventDefault();
                onFlag(r, c);
              }}
              style={
                cell.isRevealed && !cell.isMine && cell.adjacentMines > 0
                  ? { color: NUMBER_COLORS[cell.adjacentMines] }
                  : undefined
              }
            >
              {cell.isRevealed
                ? cell.isMine
                  ? "💣"
                  : cell.adjacentMines > 0
                  ? cell.adjacentMines
                  : ""
                : cell.isFlagged
                ? "🚩"
                : ""}
            </button>
          );
        })
      )}
    </div>
  );
}
