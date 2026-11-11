import { useMemo, useState } from 'react'
import IssMap from './components/IssMap.jsx'
import { useIssTracker, MIN_INTERVAL_MS, MAX_INTERVAL_MS } from './hooks/useIssTracker.js'
import { RETENTION_MS } from './db/positionStore.js'
import { bearingDeg, buildTrack, computeSpeedKmh, GAP_THRESHOLD_MS } from './lib/orbit.js'
import { ISS_NOW_URL } from './api/issApi.js'

const fmtMs = (ms) => (ms == null ? '—' : `${Math.round(ms).toLocaleString()} ms`)
const fmtSec = (ms) => `${(ms / 1000).toFixed(1)} 초`
const fmtTime = (t) => new Date(t).toLocaleTimeString('ko-KR', { hour12: false })

export default function App() {
  const { position: livePosition, positions, stats, error, isFetching } = useIssTracker()
  const [follow, setFollow] = useState(true)
  // 요청이 실패해도 IndexedDB의 마지막 좌표로 아이콘을 계속 표시한다.
  const position = livePosition ?? positions.at(-1)
  const isStale = !livePosition && !!position

  const segments = useMemo(() => buildTrack(positions, Date.now() - RETENTION_MS), [positions])
  const speed = useMemo(() => computeSpeedKmh(positions), [positions])
  const bearing = useMemo(() => {
    const n = positions.length
    if (n < 2 || positions[n - 1].timestamp - positions[n - 2].timestamp > GAP_THRESHOLD_MS) return 0
    return bearingDeg(positions[n - 2], positions[n - 1])
  }, [positions])

  const inferredCount = segments.filter((s) => s.type === 'inferred').length
  const coverageFrom = positions[0]?.timestamp

  return (
    <>
      <div className="topbar">
        <a className="brand" href="#map">◂ ISS Tracker</a>
        <nav>
          <a href="#map">궤적 지도</a>
          <a href="#stats">속도 · Polling</a>
          <a href="#log">요청 기록</a>
        </nav>
      </div>

      <header className="hero">
        <span className="badge">실시간 · Open Notify API · IndexedDB</span>
        <h1>국제 우주 정거장 실시간 추적</h1>
        <p>ISS의 현재 위치를 주기적으로 받아 지도에 표시하고, 최근 4시간의 궤적을 실측(실선)과 추정(점선)으로 함께 보여줍니다.</p>
      </header>

      <main>
        <section id="map">
          <div className="section-head">
            <span className="chip">LIVE</span>
            <h2>ISS 위치와 최근 4시간 궤적</h2>
          </div>

          <div className="card map-card">
            <div className="map-toolbar">
              <div className="legend">
                <span><i className="line solid" /> 실측 궤적</span>
                <span><i className="line dashed" /> 계산/추정 궤적</span>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
                ISS 따라가기
              </label>
            </div>
            <IssMap position={position} segments={segments} bearing={bearing} follow={follow} />
            {error && <p className="error">⚠️ 위치 조회 실패: {error.message} — 다음 요청까지 {fmtSec(stats.interval)}</p>}
          </div>
        </section>

        <section id="stats">
          <div className="section-head">
            <span className="chip">STATUS</span>
            <h2>이동 속도와 Polling 상태</h2>
          </div>

          <div className="card">
            <h3>🛰️ 이동 속도</h3>
            <div className="speed">
              <b>{speed == null ? '측정 중…' : `${Math.round(speed).toLocaleString()} km/h`}</b>
              {speed != null && <span>≈ {(speed / 3600).toFixed(2)} km/s · 고도 약 420 km 기준</span>}
            </div>
          </div>

          <div className="card">
            <h3>📡 API Polling</h3>
            <div className="status-grid">
              <div className="status s3">
                <b>{fmtSec(stats.interval)}</b>현재 Polling 간격
              </div>
              <div className="status s2">
                <b>{fmtMs(stats.lastResponseTime)}</b>최근 API 응답속도
              </div>
              <div className="status s4">
                <b>{fmtMs(stats.avgResponseTime)}</b>평균 응답속도 (EMA)
              </div>
              <div className={`status ${stats.failures ? 's5' : 's2'}`}>
                <b>{isFetching ? '요청 중…' : stats.failures ? `실패 ${stats.failures}회` : '정상'}</b>API 상태
              </div>
            </div>
            <ul>
              <li>
                간격 = max(<code>{MIN_INTERVAL_MS / 1000}초</code>, 평균 응답속도 × 10), 연속 실패 시 2배씩 늘림 (최대{' '}
                <code>{MAX_INTERVAL_MS / 1000}초</code>)
              </li>
              <li>
                요청 URL: <code>{ISS_NOW_URL}</code>
              </li>
            </ul>
          </div>

          <div className="card">
            <h3>🗂️ 저장된 좌표 (IndexedDB)</h3>
            <table>
              <tbody>
                <tr><th>현재 위치</th><td>{position ? `${position.lat.toFixed(4)}°, ${position.lon.toFixed(4)}°${isStale ? ' (마지막 저장 위치)' : ''}` : '—'}</td></tr>
                <tr><th>저장된 좌표 수</th><td>{positions.length.toLocaleString()} 개 (최근 4시간만 유지)</td></tr>
                <tr><th>실측 시작 시각</th><td>{coverageFrom ? fmtTime(coverageFrom) : '—'}</td></tr>
                <tr><th>추정 구간 수</th><td>{inferredCount} 개 (단절 기준 {GAP_THRESHOLD_MS / 1000}초 초과)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="log">
          <div className="section-head">
            <span className="chip">LOG</span>
            <h2>최근 API 요청 기록</h2>
          </div>
          <div className="card">
            <table>
              <thead>
                <tr><th>시각</th><th>결과</th><th>응답속도</th><th>다음 간격</th></tr>
              </thead>
              <tbody>
                {stats.log.length === 0 && (
                  <tr><td colSpan={4}>첫 요청을 기다리는 중…</td></tr>
                )}
                {stats.log.map((e) => (
                  <tr key={e.at}>
                    <td>{fmtTime(e.at)}</td>
                    <td>{e.ok ? <code>200 OK</code> : <code className="bad">실패</code>}</td>
                    <td>{fmtMs(e.responseTime)}</td>
                    <td>{fmtSec(e.interval)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer>
        ISS Tracker · React 19 + TanStack Query · 데이터 출처 <a href="http://open-notify.org">Open Notify</a>
      </footer>
    </>
  )
}
