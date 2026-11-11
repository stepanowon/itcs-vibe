export const ISS_NOW_URL = 'http://api.open-notify.org/iss-now.json'

const REQUEST_TIMEOUT_MS = 10_000
// API가 연속 요청에 응답하지 않는 경우가 있어, 요청 시작 간격을 항상 5초 이상 둔다.
// 새로고침 직후에도 지켜지도록 마지막 요청 시각을 localStorage에 남긴다.
export const MIN_REQUEST_GAP_MS = 5_000
const LAST_REQUEST_KEY = 'iss-tracker:last-request-at'
let lastRequestAt = 0

function readLastRequestAt() {
  try {
    return Math.max(lastRequestAt, Number(localStorage.getItem(LAST_REQUEST_KEY)) || 0)
  } catch {
    return lastRequestAt
  }
}

function markRequestStart() {
  lastRequestAt = Date.now()
  try {
    localStorage.setItem(LAST_REQUEST_KEY, String(lastRequestAt))
  } catch {
    // 저장소를 쓸 수 없으면 메모리 값만 사용한다.
  }
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    }, { once: true })
  })
}

async function waitForRequestSlot(signal) {
  const delay = readLastRequestAt() + MIN_REQUEST_GAP_MS - Date.now()
  if (delay > 0) await sleep(Math.min(delay, MIN_REQUEST_GAP_MS), signal)
  markRequestStart()
}

// ISS 현재 위치를 요청하고, 요청~응답까지 걸린 시간(ms)을 함께 반환한다.
export async function fetchIssNow(signal) {
  await waitForRequestSlot(signal)
  const startedAt = performance.now()
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  try {
    const res = await fetch(ISS_NOW_URL, { signal: combined, cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (json.message !== 'success') throw new Error('API 응답 오류')

    return {
      timestamp: json.timestamp * 1000,
      lat: Number(json.iss_position.latitude),
      lon: Number(json.iss_position.longitude),
      responseTime: performance.now() - startedAt,
    }
  } catch (err) {
    err.responseTime = performance.now() - startedAt
    throw err
  }
}
