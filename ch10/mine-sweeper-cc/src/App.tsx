import { Board } from "./components/Board";
import { Leaderboard } from "./components/Leaderboard";
import { DIFFICULTIES } from "./types";
import type { Difficulty } from "./types";
import { useMinesweeper } from "./useMinesweeper";
import "./App.css";

const STATUS_FACE: Record<string, string> = {
  idle: "🙂",
  playing: "🙂",
  won: "😎",
  lost: "😵",
};

function App() {
  const {
    board,
    difficulty,
    status,
    elapsedSeconds,
    minesRemaining,
    topScores,
    reset,
    reveal,
    flag,
  } = useMinesweeper("easy");

  return (
    <div className="app">
      <h1>지뢰 찾기</h1>

      <div className="difficulty-selector">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
          <button
            key={d}
            className={d === difficulty ? "active" : ""}
            onClick={() => reset(d)}
          >
            {DIFFICULTIES[d].label}
          </button>
        ))}
      </div>

      <div className="status-bar">
        <span className="mines-remaining">💣 {minesRemaining}</span>
        <button className="reset-button" onClick={() => reset()}>
          {STATUS_FACE[status]}
        </button>
        <span className="timer">⏱ {elapsedSeconds}s</span>
      </div>

      {status === "won" && (
        <p className="message win">클리어! 점수가 기록되었습니다.</p>
      )}
      {status === "lost" && (
        <p className="message lose">게임 오버! 다시 도전해보세요.</p>
      )}

      <div className="game-area">
        <Board
          board={board}
          disabled={status === "won" || status === "lost"}
          onReveal={reveal}
          onFlag={flag}
        />
        <Leaderboard scores={topScores} />
      </div>
    </div>
  );
}

export default App;
