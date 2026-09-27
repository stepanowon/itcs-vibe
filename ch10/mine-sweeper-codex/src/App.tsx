import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  countCorrectFlags,
  countFlags,
  countRevealedSafeCells,
  createEmptyBoard,
  createScoreEntry,
  DIFFICULTIES,
  isWin,
  placeMines,
  revealAllCells,
  revealAllMines,
  revealCell,
  toggleFlag,
} from './game';
import { loadHistory, loadSerializedState, saveHistory, saveSerializedState } from './storage';
import type { Cell, DifficultyKey, GameStatus, ScoreEntry } from './types';

const DEFAULT_DIFFICULTY: DifficultyKey = 'easy';

function createFreshGame(difficulty: DifficultyKey) {
  const config = DIFFICULTIES[difficulty];
  return {
    difficulty,
    status: 'ready' as GameStatus,
    startedAt: null as number | null,
    elapsedSeconds: 0,
    firstMoveDone: false,
    revealedCells: 0,
    flagCount: 0,
    board: createEmptyBoard(config.rows, config.cols),
  };
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function cellLabel(cell: Cell) {
  if (!cell.isRevealed) {
    return cell.isFlagged ? '⚑' : '';
  }
  if (cell.isMine) {
    return '✹';
  }
  return cell.adjacentMines === 0 ? '' : String(cell.adjacentMines);
}

function cellClass(cell: Cell, status: GameStatus) {
  const classes = ['cell'];
  if (cell.isRevealed) {
    classes.push('cell-revealed');
  }
  if (cell.isFlagged && !cell.isRevealed) {
    classes.push('cell-flagged');
  }
  if (cell.isMine && cell.isRevealed) {
    classes.push('cell-mine');
  }
  if (status === 'lost' && cell.isMine && !cell.isRevealed) {
    classes.push('cell-mine-hidden');
  }
  return classes.join(' ');
}

function persistableState(state: ReturnType<typeof createFreshGame>) {
  return {
    difficulty: state.difficulty,
    status: state.status,
    startedAt: state.startedAt,
    elapsedSeconds: state.elapsedSeconds,
    firstMoveDone: state.firstMoveDone,
    revealedCells: state.revealedCells,
    flagCount: state.flagCount,
    board: state.board,
  };
}

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyKey>(DEFAULT_DIFFICULTY);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [firstMoveDone, setFirstMoveDone] = useState(false);
  const [revealedCells, setRevealedCells] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(9, 9));
  const [history, setHistory] = useState<ScoreEntry[]>(() => loadHistory());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSerializedState();
    if (saved) {
      setDifficulty(saved.difficulty);
      setStatus(saved.status);
      setStartedAt(saved.startedAt);
      setElapsedSeconds(saved.elapsedSeconds);
      setFirstMoveDone(saved.firstMoveDone);
      setRevealedCells(saved.revealedCells);
      setFlagCount(saved.flagCount);
      setBoard(saved.board);
      setIsHydrated(true);
      return;
    }
    const initial = createFreshGame(DEFAULT_DIFFICULTY);
    setBoard(initial.board);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!firstMoveDone || status !== 'playing' || startedAt === null) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [firstMoveDone, startedAt, status]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const payload = persistableState({
      difficulty,
      status,
      startedAt,
      elapsedSeconds,
      firstMoveDone,
      revealedCells,
      flagCount,
      board,
    });
    saveSerializedState(payload);
  }, [isHydrated, difficulty, status, startedAt, elapsedSeconds, firstMoveDone, revealedCells, flagCount, board]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    saveHistory(history);
  }, [isHydrated, history]);

  const config = DIFFICULTIES[difficulty];
  const remainingMines = Math.max(0, config.mines - flagCount);
  const leaderboard = useMemo(
    () =>
      history
        .filter((entry) => entry.result === 'won')
        .sort((a, b) => b.score - a.score || a.elapsedSeconds - b.elapsedSeconds)
        .slice(0, 5),
    [history],
  );

  function resetGame(nextDifficulty = difficulty) {
    const fresh = createFreshGame(nextDifficulty);
    setDifficulty(nextDifficulty);
    setStatus(fresh.status);
    setStartedAt(fresh.startedAt);
    setElapsedSeconds(fresh.elapsedSeconds);
    setFirstMoveDone(fresh.firstMoveDone);
    setRevealedCells(fresh.revealedCells);
    setFlagCount(fresh.flagCount);
    setBoard(fresh.board);
  }

  function finishGame(nextStatus: 'won' | 'lost', nextBoard: Cell[][]) {
    const currentConfig = DIFFICULTIES[difficulty];
    const finalElapsedSeconds =
      startedAt === null ? elapsedSeconds : Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const safeRevealed = countRevealedSafeCells(nextBoard);
    const correctFlags = countCorrectFlags(nextBoard);
    const totalFlags = countFlags(nextBoard);
    const entry = createScoreEntry({
      difficulty: currentConfig,
      elapsedSeconds: finalElapsedSeconds,
      revealedCells: safeRevealed,
      flaggedCells: totalFlags,
      correctFlags,
      status: nextStatus,
    });

    setStatus(nextStatus);
    setBoard(nextBoard);
    setElapsedSeconds(finalElapsedSeconds);
    setRevealedCells(safeRevealed);
    setFlagCount(totalFlags);
    setHistory((prev) => [entry, ...prev]);
  }

  function handleReveal(row: number, col: number) {
    if (status === 'won' || status === 'lost') {
      return;
    }

    let nextBoard = board;
    let nextStartedAt = startedAt;

    if (!firstMoveDone) {
      nextBoard = placeMines(board, config.mines, row, col);
      nextStartedAt = Date.now();
      setFirstMoveDone(true);
      setStartedAt(nextStartedAt);
      setStatus('playing');
    }

    if (nextBoard[row][col].isFlagged || nextBoard[row][col].isRevealed) {
      return;
    }

    const revealedBoard = revealCell(nextBoard, row, col);
    if (revealedBoard[row][col].isMine) {
      finishGame('lost', revealAllMines(revealedBoard));
      return;
    }

    const revealedSafeCells = countRevealedSafeCells(revealedBoard);
    setBoard(revealedBoard);
    setRevealedCells(revealedSafeCells);

    if (isWin(revealedBoard, config.mines)) {
      const completedBoard = revealAllCells(revealedBoard);
      finishGame('won', completedBoard);
      return;
    }

    if (nextStartedAt !== startedAt && nextStartedAt !== null) {
      setElapsedSeconds(0);
    }
  }

  function handleFlag(row: number, col: number) {
    if (status === 'won' || status === 'lost') {
      return;
    }
    if (!firstMoveDone) {
      return;
    }
    const nextBoard = toggleFlag(board, row, col);
    setBoard(nextBoard);
    setFlagCount(countFlags(nextBoard));
  }

  function handleCellContextMenu(event: MouseEvent, row: number, col: number) {
    event.preventDefault();
    handleFlag(row, col);
  }

  function handleCellClick(row: number, col: number) {
    handleReveal(row, col);
  }

  const statusCopy = {
    ready: '첫 클릭을 기다리는 중',
    playing: '게임 진행 중',
    won: '클리어 성공',
    lost: '실패',
  }[status];

  const statusFace = {
    ready: '🙂',
    playing: '😮',
    won: '😎',
    lost: '😵',
  }[status];

  return (
    <main className="app-shell compact-shell">
      <header className="page-header">
        <h1>지뢰 찾기</h1>
      </header>

      <section className="difficulty-switch" aria-label="난이도 선택">
        {Object.values(DIFFICULTIES).map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === difficulty ? 'chip active' : 'chip'}
            onClick={() => resetGame(item.key)}
          >
            {item.label} ({item.rows}x{item.cols}, 지뢰 {item.mines}개)
          </button>
        ))}
      </section>

      <section className="status-strip" aria-label="게임 상태">
        <div className="status-pill">
          <span className="status-icon">💣</span>
          <span>{remainingMines}</span>
        </div>
        <button
          type="button"
          className="face-button"
          onClick={() => resetGame(difficulty)}
          aria-label={`새 게임, 현재 상태: ${statusCopy}`}
          title={statusCopy}
        >
          <span className="face-icon">{statusFace}</span>
        </button>
        <div className="status-pill">
          <span className="status-icon">⏱</span>
          <span>{formatTime(elapsedSeconds)}</span>
        </div>
      </section>

      <section className="game-layout">
        <div className="board-panel">
          <div className="board-wrap">
            <div
              className="board"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                minWidth: `${config.cols * 28}px`,
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={cellClass(cell, status)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(event) => handleCellContextMenu(event, rowIndex, colIndex)}
                    aria-label={`행 ${rowIndex + 1}, 열 ${colIndex + 1}`}
                  >
                    <span className="cell-content">{cellLabel(cell)}</span>
                  </button>
                )),
              )}
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <section className="panel leaderboard-panel">
            <div className="panel-header compact">
              <h2>최고 점수 Top 5</h2>
            </div>
            <ol className="leaderboard">
              {leaderboard.length === 0 ? (
                <li className="empty-state">아직 기록이 없습니다.</li>
              ) : (
                leaderboard.map((entry, index) => (
                  <li key={entry.id} className="score-row">
                    <div className="score-rank">{index + 1}</div>
                    <div className="score-meta">
                      <strong>{entry.difficultyLabel} 난이도</strong>
                      <p>{formatTime(entry.elapsedSeconds)}</p>
                    </div>
                    <div className="score-value">{entry.score}</div>
                  </li>
                ))
              )}
            </ol>
          </section>
        </aside>
      </section>
    </main>
  );
}
