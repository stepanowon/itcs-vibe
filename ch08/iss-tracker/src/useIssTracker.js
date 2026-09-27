import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { addPoint, getRecentPoints } from './issHistoryDb'

const MIN_INTERVAL_MS = 5000
const MAX_INTERVAL_MS = 30000

async function fetchIssNow() {
  const start = performance.now()
  const res = await fetch('http://api.open-notify.org/iss-now.json')
  if (!res.ok) throw new Error(`ISS API error: ${res.status}`)
  const json = await res.json()
  const latencyMs = performance.now() - start
  return {
    timestamp: json.timestamp,
    lat: parseFloat(json.iss_position.latitude),
    lon: parseFloat(json.iss_position.longitude),
    latencyMs,
  }
}

export function useIssTracker() {
  const [pollInterval, setPollInterval] = useState(MIN_INTERVAL_MS)
  const [history, setHistory] = useState([])
  const lastTimestamp = useRef(null)

  const query = useQuery({
    queryKey: ['iss-now'],
    queryFn: fetchIssNow,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (!query.data) return
    if (query.data.timestamp === lastTimestamp.current) return
    lastTimestamp.current = query.data.timestamp

    // ponytail: latency*16 clamped to [5s, 30s] is a naive heuristic, not a
    // congestion-control algorithm — revisit with a moving average if the
    // API's response time gets noisy in practice.
    const next = Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, query.data.latencyMs * 16))
    setPollInterval(next)

    addPoint({ timestamp: query.data.timestamp, lat: query.data.lat, lon: query.data.lon })
      .then(() => getRecentPoints())
      .then(setHistory)
  }, [query.data])

  useEffect(() => {
    getRecentPoints().then(setHistory)
  }, [])

  return {
    current: query.data,
    isLoading: query.isLoading,
    error: query.error,
    pollIntervalMs: pollInterval,
    latencyMs: query.data?.latencyMs ?? null,
    history,
  }
}
