import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchIssNow } from '../api/issApi.js'
import { loadRecentPositions, savePosition } from '../db/positionStore.js'

export const MIN_INTERVAL_MS = 5_000
export const MAX_INTERVAL_MS = 60_000
// 응답 시간이 Polling 주기의 10%를 넘지 않도록 간격을 잡는다.
const RESPONSE_BUDGET_RATIO = 10
const EMA_ALPHA = 0.3
const LOG_SIZE = 10

// 응답 시간(EMA)과 연속 실패 횟수로 다음 Polling 간격을 계산한다.
function nextInterval(avgResponseTime, failures) {
  const base = Math.max(MIN_INTERVAL_MS, avgResponseTime * RESPONSE_BUDGET_RATIO)
  const backoff = base * 2 ** Math.min(failures, 4)
  return Math.round(Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, backoff)))
}

const initialStats = {
  lastResponseTime: null,
  avgResponseTime: null,
  interval: MIN_INTERVAL_MS,
  failures: 0,
  log: [],
}

export function useIssTracker() {
  const queryClient = useQueryClient()
  const statsRef = useRef(initialStats)
  const [stats, setStats] = useState(initialStats)

  const record = useCallback((responseTime, ok) => {
    const prev = statsRef.current
    const avg = prev.avgResponseTime == null ? responseTime : prev.avgResponseTime * (1 - EMA_ALPHA) + responseTime * EMA_ALPHA
    const failures = ok ? 0 : prev.failures + 1
    const interval = nextInterval(avg, failures)
    const entry = { at: Date.now(), responseTime, interval, ok }
    const next = {
      lastResponseTime: responseTime,
      avgResponseTime: avg,
      interval,
      failures,
      log: [entry, ...prev.log].slice(0, LOG_SIZE),
    }
    statsRef.current = next
    setStats(next)
  }, [])

  const nowQuery = useQuery({
    queryKey: ['iss-now'],
    queryFn: async ({ signal }) => {
      try {
        const data = await fetchIssNow(signal)
        record(data.responseTime, true)
        return data
      } catch (err) {
        if (err.name !== 'AbortError' || !signal.aborted) record(err.responseTime ?? 0, false)
        throw err
      }
    },
    // 매 응답 후 다시 평가되므로, 측정된 응답 속도에 맞춰 간격이 실시간으로 바뀐다.
    refetchInterval: () => statsRef.current.interval,
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: 0,
  })

  const trackQuery = useQuery({
    queryKey: ['track'],
    queryFn: () => loadRecentPositions(),
    // 새 좌표가 없어도 1분마다 다시 읽어 4시간 지난 좌표를 정리한다.
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  })

  const { mutate: persist } = useMutation({
    mutationFn: savePosition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['track'] }),
  })

  const position = nowQuery.data
  useEffect(() => {
    if (position) persist(position)
  }, [position, persist])

  return {
    position,
    positions: trackQuery.data ?? [],
    stats,
    error: nowQuery.error,
    isFetching: nowQuery.isFetching,
  }
}
