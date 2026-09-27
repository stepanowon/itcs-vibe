const EARTH_RADIUS_KM = 6371
const GAP_THRESHOLD_SEC = 60 // 이 이상 비면 "단절"로 보고 보간
const INTERP_STEP_SEC = 10
const WINDOW_SEC = 4 * 60 * 60 // issHistoryDb.js의 RETENTION_MS와 맞춰야 함
const ORBIT_PERIOD_SEC = 92.68 * 60 // ISS 평균 공전 주기
const MAX_LAT_DEG = 51.6 // ISS 궤도 경사각 — 위도는 이 범위를 벗어나지 않음
const BACKFILL_STEP_SEC = 60

export function haversineDistanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

// ponytail: linear lat/lon interpolation, not a great-circle slerp — fine for
// gaps of a few minutes given the ISS's near-constant ground speed, but will
// visibly cut corners over long gaps or near the poles/antimeridian.
export function buildDisplayTrajectory(points) {
  if (points.length < 2) return points.map((p) => ({ ...p, interpolated: false }))

  const result = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    result.push({ ...a, interpolated: a.interpolated ?? false })

    const gapSec = b.timestamp - a.timestamp
    if (gapSec > GAP_THRESHOLD_SEC) {
      const steps = Math.floor(gapSec / INTERP_STEP_SEC) - 1
      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1)
        result.push({
          timestamp: a.timestamp + gapSec * t,
          lat: a.lat + (b.lat - a.lat) * t,
          lon: a.lon + (b.lon - a.lon) * t,
          interpolated: true,
        })
      }
    }
  }
  const last = points[points.length - 1]
  result.push({ ...last, interpolated: last.interpolated ?? false })
  return result
}

function normalizeLonDiff(diff) {
  if (diff > 180) return diff - 360
  if (diff < -180) return diff + 360
  return diff
}

// API가 주는 경도는 ±180에서 wrap되어 있어서, 두 실측점이 날짜변경선을 사이에 두면
// (예: 179 → -179) 그대로 이어그리면 지구를 반 바퀴 도는 잘못된 직선이 된다. 각 점을
// 이전 점과의 최단 각도 차이만큼씩 누적해서 wrap이 없는 연속 좌표로 바꿔준다 — 이후
// 보간/지도 렌더링에서 별도의 날짜변경선 처리가 필요 없어진다.
export function unwrapLongitudes(points) {
  if (points.length === 0) return points
  const result = [{ ...points[0] }]
  let lon = points[0].lon
  for (let i = 1; i < points.length; i++) {
    lon += normalizeLonDiff(points[i].lon - points[i - 1].lon)
    result.push({ ...points[i], lon })
  }
  return result
}

// ponytail: 실제 궤도역학(SGP4 등) 대신 위도는 사인파, 경도는 관측된 평균 각속도로 선형
// 추정하는 나이브 모델 — 관측된 두 점으로 위상/방향만 맞추고 그 이전은 주기적으로 반복시킨다.
// 궤도 마디 이동(nodal precession)은 반영하지 않으므로 몇 시간 이상 전으로 갈수록 실제
// 지상궤적과 어긋난다. 정밀도가 필요하면 SGP4 + TLE 기반 전파로 교체할 것.
function estimateBackfill(earliest, next, windowStart) {
  if (earliest.timestamp <= windowStart) return []

  const omega = (2 * Math.PI) / ORBIT_PERIOD_SEC
  const ratio = Math.max(-1, Math.min(1, earliest.lat / MAX_LAT_DEG))
  let phase = Math.asin(ratio)

  const observedLatRate = next.lat - earliest.lat
  if (Math.sign(Math.cos(phase)) !== Math.sign(observedLatRate) && observedLatRate !== 0) {
    phase = Math.PI - phase
  }

  const dt = next.timestamp - earliest.timestamp
  const lonRate = dt > 0 ? normalizeLonDiff(next.lon - earliest.lon) / dt : 0

  const points = []
  for (let t = earliest.timestamp - BACKFILL_STEP_SEC; t >= windowStart; t -= BACKFILL_STEP_SEC) {
    const elapsed = t - earliest.timestamp
    points.push({
      timestamp: t,
      lat: MAX_LAT_DEG * Math.sin(omega * elapsed + phase),
      lon: earliest.lon + lonRate * elapsed,
      interpolated: true,
    })
  }
  return points.reverse()
}

// 실측 데이터가 최근 4시간을 다 채우지 못했다면(막 시작한 경우 등), 가장 오래된 실측
// 지점에서부터 4시간 전까지를 유추해서 앞에 붙여준다.
export function withBackfill(points, nowTs, windowSec = WINDOW_SEC) {
  if (points.length < 2) return points
  const windowStart = nowTs - windowSec
  const backfill = estimateBackfill(points[0], points[1], windowStart)
  return [...backfill, ...points]
}

// unwrapLongitudes는 실측 사이 간격이 길면(폴링이 한동안 끊겼다가 재개된 경우 등) 실제
// 이동 방향을 알 수 없어 "최단 경로"로 가정하는데, 그 가정이 틀리면 이후 좌표 전체가
// 360°의 배수만큼 밀려서 계산된다 — 지구상 같은 위치지만, 고정된 세계지도 뷰에서는 궤적의
// 끝부분이 화면 밖(다른 world copy)으로 밀려나 마커와 끊어져 보인다. 마지막 점을 실제 관측된
// 현재 위치(currentLon)에 맞춰 360°단위로 재정렬해서 항상 마커와 이어지도록 한다.
export function realignToCurrentLon(trajectory, currentLon) {
  if (trajectory.length === 0 || currentLon == null) return trajectory
  const shift = Math.round((currentLon - trajectory[trajectory.length - 1].lon) / 360) * 360
  if (shift === 0) return trajectory
  return trajectory.map((p) => ({ ...p, lon: p.lon + shift }))
}

// 실선/점선 구간으로 나눈다: 두 점 중 하나라도 보간된 점이면 그 구간은 추정 궤적(점선).
// unwrapLongitudes를 거친 연속 좌표를 받는다는 전제이므로 날짜변경선을 따로 처리하지 않는다.
export function buildTrajectorySegments(trajectory) {
  if (trajectory.length < 2) return []

  const pos = (p) => [p.lat, p.lon]
  const isEstimated = (a, b) => a.interpolated || b.interpolated

  const segments = []
  let current = { estimated: isEstimated(trajectory[0], trajectory[1]), positions: [pos(trajectory[0])] }

  for (let i = 1; i < trajectory.length; i++) {
    const estimated = isEstimated(trajectory[i - 1], trajectory[i])
    if (estimated !== current.estimated) {
      segments.push(current)
      current = { estimated, positions: [pos(trajectory[i - 1])] }
    }
    current.positions.push(pos(trajectory[i]))
  }
  segments.push(current)
  return segments
}

// 원본 좌표(history)에서 단절되어 보간이 들어간 시간 구간만 뽑아낸다.
export function detectGaps(points) {
  const gaps = []
  for (let i = 0; i < points.length - 1; i++) {
    const gapSec = points[i + 1].timestamp - points[i].timestamp
    if (gapSec > GAP_THRESHOLD_SEC) {
      gaps.push({ startTs: points[i].timestamp, endTs: points[i + 1].timestamp, durationSec: gapSec })
    }
  }
  return gaps
}

export function currentSpeedKmH(points) {
  if (points.length < 2) return null
  const a = points[points.length - 2]
  const b = points[points.length - 1]
  const hours = (b.timestamp - a.timestamp) / 3600
  if (hours <= 0) return null
  return haversineDistanceKm(a, b) / hours
}
