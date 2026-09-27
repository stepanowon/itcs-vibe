import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { buildTrajectorySegments } from './trajectory'

const issIcon = L.divIcon({
  className: 'iss-icon',
  html: `<svg width="36" height="36" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <g fill="#4f46e5" stroke="#1e293b" stroke-width="1.5">
      <rect x="10" y="26" width="12" height="12" rx="1" fill="#a5b4fc"/>
      <rect x="42" y="26" width="12" height="12" rx="1" fill="#a5b4fc"/>
      <line x1="22" y1="32" x2="26" y2="32" stroke="#1e293b" stroke-width="2"/>
      <line x1="38" y1="32" x2="42" y2="32" stroke="#1e293b" stroke-width="2"/>
      <ellipse cx="32" cy="32" rx="7" ry="6" fill="#e2e8f0"/>
    </g>
  </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

export function IssMap({ current, trajectory }) {
  const segments = buildTrajectorySegments(trajectory)

  return (
    <MapContainer
      center={[20, 0]}
      zoom={1}
      minZoom={1}
      worldCopyJump
      style={{ height: 420, width: '100%', borderRadius: 16 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {segments.map((seg, i) => (
        <Polyline
          key={i}
          positions={seg.positions}
          pathOptions={{ color: '#4f46e5', weight: 2, dashArray: seg.estimated ? '2 4' : null }}
        />
      ))}
      {current && <Marker position={[current.lat, current.lon]} icon={issIcon} />}
    </MapContainer>
  )
}
