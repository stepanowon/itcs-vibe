import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { splitAtAntimeridian } from '../lib/orbit.js'
import { createIssIcon } from './issIcon.js'

const ACTUAL_STYLE = { color: '#4f46e5', weight: 3, opacity: 0.9 }
const INFERRED_STYLE = { color: '#06b6d4', weight: 2.5, opacity: 0.9, dashArray: '6 8' }

function FollowIss({ position, follow }) {
  const map = useMap()
  useEffect(() => {
    if (follow && position) map.panTo([position.lat, position.lon], { animate: true })
  }, [map, position, follow])
  return null
}

export default function IssMap({ position, segments, bearing, follow }) {
  const icon = useMemo(() => createIssIcon(bearing ?? 0), [bearing])
  const lines = useMemo(
    () => segments.map((seg) => ({ type: seg.type, lines: splitAtAntimeridian(seg.coords) })),
    [segments],
  )

  return (
    <MapContainer className="iss-map" center={[0, 0]} zoom={2} minZoom={1} worldCopyJump>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {lines.map((seg, i) => (
        <Polyline key={`${seg.type}-${i}`} positions={seg.lines} pathOptions={seg.type === 'actual' ? ACTUAL_STYLE : INFERRED_STYLE} />
      ))}
      {position && (
        <Marker position={[position.lat, position.lon]} icon={icon}>
          <Tooltip direction="top" offset={[0, -24]}>
            ISS · {position.lat.toFixed(4)}, {position.lon.toFixed(4)}
          </Tooltip>
        </Marker>
      )}
      <FollowIss position={position} follow={follow} />
    </MapContainer>
  )
}
