import * as satellite from 'satellite.js'

// 한반도 전체(남+북)를 넉넉히 덮는 경계 상자.
const KOREA_BOUNDS = { minLat: 33, maxLat: 43, minLon: 124, maxLon: 131.5 }
const STEP_SEC = 20

function isOverKorea(lat, lon) {
  return (
    lat >= KOREA_BOUNDS.minLat &&
    lat <= KOREA_BOUNDS.maxLat &&
    lon >= KOREA_BOUNDS.minLon &&
    lon <= KOREA_BOUNDS.maxLon
  )
}

// ponytail: 지상궤적이 한반도 경계 상자를 지나는 구간만 찾는 방식 — 실제 육안 관측 여부를
// 결정하는 태양 고도각/관측자 앙각 계산은 하지 않는다(밤에도, 낮에도 통과 시간을 알려줌).
// 더 정밀한 "보이는 통과"가 필요하면 태양 위치 + 지평선 앙각 계산을 추가할 것.
export function predictKoreaPasses(line1, line2, { fromDate, hours = 48 } = {}) {
  const satrec = satellite.twoline2satrec(line1, line2)
  const start = fromDate ?? new Date()
  const totalSteps = Math.floor((hours * 3600) / STEP_SEC)

  const passes = []
  let current = null

  for (let i = 0; i <= totalSteps; i++) {
    const date = new Date(start.getTime() + i * STEP_SEC * 1000)
    const { position } = satellite.propagate(satrec, date)
    if (!position) continue

    const geo = satellite.eciToGeodetic(position, satellite.gstime(date))
    const lat = satellite.degreesLat(geo.latitude)
    const lon = satellite.degreesLong(geo.longitude)

    if (isOverKorea(lat, lon)) {
      if (!current) current = { start: date, end: date }
      else current.end = date
    } else if (current) {
      passes.push(current)
      current = null
    }
  }
  if (current) passes.push(current)
  return passes
}
