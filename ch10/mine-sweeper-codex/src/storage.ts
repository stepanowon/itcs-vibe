import type { ScoreEntry, SerializedGameState } from './types';

const HISTORY_KEY = 'mine-sweeper.history.v1';
const STATE_KEY = 'mine-sweeper.state.v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadHistory() {
  return readJson<ScoreEntry[]>(HISTORY_KEY, []);
}

export function saveHistory(entries: ScoreEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function loadSerializedState() {
  return readJson<SerializedGameState | null>(STATE_KEY, null);
}

export function saveSerializedState(state: SerializedGameState | null) {
  if (state === null) {
    localStorage.removeItem(STATE_KEY);
    return;
  }
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
