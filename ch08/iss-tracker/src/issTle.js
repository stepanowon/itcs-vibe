// open-notify에는 통과시각 예측 API(iss-pass.json)가 있었지만 서비스가 중단되어(404),
// TLE(궤도요소)를 직접 받아 SGP4로 전파하는 방식으로 대체한다. celestrak은 TLE를 주지만
// CORS를 막아놔서 브라우저에서 바로 fetch가 안 되고, wheretheiss.at은 CORS를 열어준다.
export async function fetchIssTle() {
  const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544/tles')
  if (!res.ok) throw new Error(`TLE API error: ${res.status}`)
  const json = await res.json()
  return { line1: json.line1, line2: json.line2 }
}
