// ISS 궤도를 원궤도로 근사해서 임의 시각의 위치를 계산/추정한다.
// - 궤도 경사각 51.64°, 공전 주기 약 92.9분
// - 지구 자전과 승교점 세차(J2, 약 -5°/일)를 반영해 지상 궤적을 만든다.
const DEG = Math.PI / 180
const INCLINATION = 51.64 * DEG
const ORBIT_PERIOD_S = 92.9 * 60
const MEAN_MOTION = (2 * Math.PI) / ORBIT_PERIOD_S // rad/s
const EARTH_ROTATION = (2 * Math.PI) / 86164.1 // rad/s (항성일)
const NODAL_REGRESSION = (-5.0 * DEG) / 86400 // rad/s

export const EARTH_RADIUS_KM = 6371
export const ISS_ALTITUDE_KM = 420

// 실측 좌표 사이 간격이 이보다 길면 "단절"로 보고 궤적을 추정한다.
export const GAP_THRESHOLD_MS = 60_000
const SAMPLE_STEP_MS = 30_000
const NEIGHBOR_WINDOW_MS = 5 * 60_000

export const normalizeLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// 궤도면 안에서의 위상(u)에 따른, 승교점 기준 경도 차이
const lonOffsetFromNode = (u) => Math.atan2(Math.cos(INCLINATION) * Math.sin(u), Math.cos(u))

// 기준점(위치 + 북상/남하 방향)으로부터 궤도 상태를 만든다.
function makeAnchor(point, ascending) {
  const s = clamp(Math.sin(point.lat * DEG) / Math.sin(INCLINATION), -1, 1)
  const u0 = ascending ? Math.asin(s) : Math.PI - Math.asin(s)
  return {
    t: point.timestamp,
    u0,
    node0: point.lon * DEG - lonOffsetFromNode(u0),
  }
}

// 기준점에서 dt만큼 떨어진 시각의 위치
function propagate(anchor, t) {
  const dt = (t - anchor.t) / 1000
  const u = anchor.u0 + MEAN_MOTION * dt
  const lat = Math.asin(Math.sin(INCLINATION) * Math.sin(u)) / DEG
  const lon = (anchor.node0 + lonOffsetFromNode(u) + (NODAL_REGRESSION - EARTH_ROTATION) * dt) / DEG
  return { lat, lon: normalizeLon(lon) }
}

// 주변 실측 좌표로 북상(ascending) 중인지 판단. 알 수 없으면 null
function directionAt(points, i) {
  const p = points[i]
  const next = points[i + 1]
  if (next && next.timestamp - p.timestamp <= NEIGHBOR_WINDOW_MS && next.lat !== p.lat) return next.lat > p.lat
  const prev = points[i - 1]
  if (prev && p.timestamp - prev.timestamp <= NEIGHBOR_WINDOW_MS && prev.lat !== p.lat) return p.lat > prev.lat
  return null
}

const lonDiff = (a, b) => normalizeLon(b - a)
const distanceSq = (a, b) => (a.lat - b.lat) ** 2 + lonDiff(a.lon, b.lon) ** 2

// 방향을 모를 때는 상대 좌표를 더 잘 설명하는 쪽을 고른다.
function anchorFor(points, i, reference) {
  const dir = directionAt(points, i)
  if (dir !== null) return makeAnchor(points[i], dir)
  if (!reference) return makeAnchor(points[i], true)
  const asc = makeAnchor(points[i], true)
  const desc = makeAnchor(points[i], false)
  return distanceSq(propagate(asc, reference.timestamp), reference) <=
    distanceSq(propagate(desc, reference.timestamp), reference)
    ? asc
    : desc
}

function sampleTimes(from, to) {
  const times = []
  for (let t = from; t < to; t += SAMPLE_STEP_MS) times.push(t)
  times.push(to)
  return times
}

// 두 실측점 사이 단절 구간: 양 끝점에서 각각 전파한 위치를 시간 비율로 섞는다.
function fillGap(points, i) {
  const a = points[i]
  const b = points[i + 1]
  const anchorA = anchorFor(points, i, b)
  const anchorB = anchorFor(points, i + 1, a)
  return sampleTimes(a.timestamp, b.timestamp).map((t) => {
    const w = (t - a.timestamp) / (b.timestamp - a.timestamp)
    const pa = propagate(anchorA, t)
    const pb = propagate(anchorB, t)
    return {
      lat: pa.lat * (1 - w) + pb.lat * w,
      lon: normalizeLon(pa.lon + lonDiff(pa.lon, pb.lon) * w),
    }
  })
}

// 가장 오래된 실측점 이전 ~ windowStart 구간을 역산한다.
function backfill(points, windowStart) {
  const first = points[0]
  const anchor = anchorFor(points, 0, null)
  return sampleTimes(windowStart, first.timestamp).map((t) => propagate(anchor, t))
}

/**
 * 저장된 좌표로 최근 4시간 궤적을 만든다.
 * @returns {{ type: 'actual' | 'inferred', coords: {lat, lon}[] }[]}
 */
export function buildTrack(points, windowStart) {
  const pts = points.filter((p) => p.timestamp >= windowStart).sort((a, b) => a.timestamp - b.timestamp)
  if (pts.length === 0) return []

  const segments = []
  if (pts[0].timestamp - windowStart > GAP_THRESHOLD_MS) {
    segments.push({ type: 'inferred', coords: backfill(pts, windowStart) })
  }

  let actual = [pts[0]]
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i + 1].timestamp - pts[i].timestamp > GAP_THRESHOLD_MS) {
      if (actual.length > 1) segments.push({ type: 'actual', coords: actual })
      segments.push({ type: 'inferred', coords: fillGap(pts, i) })
      actual = []
    }
    actual.push(pts[i + 1])
  }
  if (actual.length > 1) segments.push({ type: 'actual', coords: actual })
  return segments
}

// 날짜변경선(±180°)을 넘는 선은 경계에서 끊어 지도에 가로줄이 생기지 않게 한다.
export function splitAtAntimeridian(coords) {
  const lines = []
  let line = []
  coords.forEach((p, i) => {
    const prev = coords[i - 1]
    if (prev && Math.abs(p.lon - prev.lon) > 180) {
      const edge = prev.lon > 0 ? 180 : -180
      const span = lonDiff(prev.lon, p.lon)
      const ratio = span === 0 ? 0 : lonDiff(prev.lon, edge) / span
      const latAtEdge = prev.lat + (p.lat - prev.lat) * ratio
      line.push([latAtEdge, edge])
      lines.push(line)
      line = [[latAtEdge, -edge]]
    }
    line.push([p.lat, p.lon])
  })
  if (line.length > 1) lines.push(line)
  return lines
}

// 위경도 → 지구 중심 직교좌표(km)
function toCartesian({ lat, lon }) {
  const r = EARTH_RADIUS_KM + ISS_ALTITUDE_KM
  const φ = lat * DEG
  const λ = lon * DEG
  return [r * Math.cos(φ) * Math.cos(λ), r * Math.cos(φ) * Math.sin(λ), r * Math.sin(φ)]
}

// 최근 실측 좌표로 궤도 속도(km/h)를 계산한다.
// API 좌표는 지구와 함께 도는 좌표계이므로 지구 자전 속도(ω × r)를 더해 관성 속도로 바꾼다.
// timestamp가 초 단위라 1분 이내에서 가장 오래된 점과 비교해 오차를 줄인다.
export function computeSpeedKmh(points) {
  if (points.length < 2) return null
  const last = points[points.length - 1]
  let base = points[points.length - 2]
  for (let i = points.length - 2; i >= 0; i--) {
    if (last.timestamp - points[i].timestamp > GAP_THRESHOLD_MS) break
    base = points[i]
  }
  const dt = (last.timestamp - base.timestamp) / 1000
  if (dt <= 0 || dt * 1000 > GAP_THRESHOLD_MS) return null

  const p1 = toCartesian(base)
  const p2 = toCartesian(last)
  const mid = p1.map((v, i) => (v + p2[i]) / 2)
  const v = [
    (p2[0] - p1[0]) / dt - EARTH_ROTATION * mid[1],
    (p2[1] - p1[1]) / dt + EARTH_ROTATION * mid[0],
    (p2[2] - p1[2]) / dt,
  ]
  return Math.hypot(...v) * 3600
}

// 진행 방향(북쪽 기준 시계방향 각도)
export function bearingDeg(a, b) {
  const φ1 = a.lat * DEG
  const φ2 = b.lat * DEG
  const Δλ = (b.lon - a.lon) * DEG
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) / DEG + 360) % 360
}
