import { DIFFICULTIES } from "../types";
import type { ScoreEntry } from "../types";

export function Leaderboard({ scores }: { scores: ScoreEntry[] }) {
  return (
    <aside className="leaderboard">
      <h2>최고 점수 Top 5</h2>
      {scores.length === 0 ? (
        <p className="empty">아직 기록이 없습니다.</p>
      ) : (
        <ol>
          {scores.map((s, i) => (
            <li key={i}>
              <span className="rank">{i + 1}</span>
              <span className="score">{s.score}점</span>
              <span className="meta">
                {DIFFICULTIES[s.difficulty].label.split(" ")[0]} ·{" "}
                {s.elapsedSeconds}초
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
