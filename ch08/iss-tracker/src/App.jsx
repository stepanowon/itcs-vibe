import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IssMap } from './IssMap'
import { useIssTracker } from './useIssTracker'
import {
  buildDisplayTrajectory,
  currentSpeedKmH,
  detectGaps,
  realignToCurrentLon,
  unwrapLongitudes,
  withBackfill,
} from './trajectory'
import { fetchIssTle } from './issTle'
import { predictKoreaPasses } from './koreaPass'

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString('ko-KR')
}

function formatDateTime(date) {
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'medium' })
}

export default function App() {
  const { current, isLoading, error, pollIntervalMs, latencyMs, history } = useIssTracker()

  const trajectory = useMemo(() => {
    const built = buildDisplayTrajectory(withBackfill(unwrapLongitudes(history), Date.now() / 1000))
    return realignToCurrentLon(built, current?.lon)
  }, [history, current])
  const speedKmH = useMemo(() => currentSpeedKmH(history), [history])
  const gaps = useMemo(() => detectGaps(history), [history])

  const tleQuery = useQuery({
    queryKey: ['iss-tle'],
    queryFn: fetchIssTle,
    staleTime: 6 * 60 * 60 * 1000, // TLE는 몇 시간 단위로만 바뀌므로 자주 다시 받을 필요 없음
  })
  const koreaPasses = useMemo(() => {
    if (!tleQuery.data) return []
    return predictKoreaPasses(tleQuery.data.line1, tleQuery.data.line2, { hours: 48 })
  }, [tleQuery.data])

  return (
    <>
      <header className="hero">
        <span className="badge">실시간 추적</span>
        <h1>국제 우주 정거장(ISS) 위치 추적</h1>
        <p>open-notify.org API로 ISS의 현재 위치를 받아와 지도와 최근 4시간 궤적을 표시합니다.</p>
      </header>

      <main>
        <section>
          <div className="card">
            {error && <p style={{ color: '#b91c1c' }}>API 호출 오류: {error.message}</p>}
            {isLoading && !current && <p>위치 정보를 불러오는 중...</p>}
            <IssMap current={current} trajectory={trajectory} />

            <div className="status-grid" style={{ marginTop: 20 }}>
              <div className="status s3">
                <b>{speedKmH ? `${speedKmH.toFixed(0)} km/h` : '—'}</b>
                이동 속도
              </div>
              <div className="status s2">
                <b>{(pollIntervalMs / 1000).toFixed(1)}초</b>
                현재 Polling 간격
              </div>
              <div className="status s5">
                <b>{latencyMs != null ? `${latencyMs.toFixed(0)} ms` : '—'}</b>
                API 응답속도
              </div>
              <div className="status s4">
                <b>{history.length}개</b>
                저장된 좌표 (최근 4시간)
              </div>
            </div>

            {current && (
              <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 14 }}>
                현재 위치: 위도 {current.lat.toFixed(4)}, 경도 {current.lon.toFixed(4)}
              </p>
            )}

            {gaps.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 14, color: 'var(--accent)', margin: '0 0 8px' }}>
                  단절 구간 (점선으로 표시된 추정 궤적)
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: '#334155' }}>
                  {gaps.map((g, i) => (
                    <li key={i}>
                      {formatTime(g.startTs)} ~ {formatTime(g.endTs)} ({Math.round(g.durationSec)}초 단절)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, color: 'var(--accent)', margin: '0 0 12px' }}>
              한반도 상공 통과 예정 시각 (앞으로 48시간)
            </h3>
            {tleQuery.isLoading && <p>궤도 데이터를 불러오는 중...</p>}
            {tleQuery.error && (
              <p style={{ color: '#b91c1c' }}>궤도 데이터 조회 실패: {tleQuery.error.message}</p>
            )}
            {tleQuery.data && koreaPasses.length === 0 && <p>앞으로 48시간 내 예정된 통과가 없습니다.</p>}
            {koreaPasses.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: '#334155' }}>
                {koreaPasses.map((p, i) => (
                  <li key={i}>
                    {formatDateTime(p.start)} ~ {p.end.toLocaleTimeString('ko-KR')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <footer>ISS Tracker · React 19 + TanStack Query</footer>
    </>
  )
}
