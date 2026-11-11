import L from 'leaflet'

// 우주 정거장 모양 아이콘: 가운데 모듈 + 트러스 + 양쪽 태양전지판.
// 모듈 축이 위(북쪽)를 향하도록 그리고, 진행 방향(bearing)만큼 회전시킨다.
const ISS_SVG = `
<svg viewBox="0 0 64 64" width="52" height="52" xmlns="http://www.w3.org/2000/svg">
  <g fill="#4f46e5" stroke="#1e1b4b" stroke-width="0.8">
    <rect x="4" y="12" width="8" height="16" rx="1"/>
    <rect x="4" y="36" width="8" height="16" rx="1"/>
    <rect x="14" y="12" width="8" height="16" rx="1"/>
    <rect x="14" y="36" width="8" height="16" rx="1"/>
    <rect x="42" y="12" width="8" height="16" rx="1"/>
    <rect x="42" y="36" width="8" height="16" rx="1"/>
    <rect x="52" y="12" width="8" height="16" rx="1"/>
    <rect x="52" y="36" width="8" height="16" rx="1"/>
  </g>
  <g stroke="#a5b4fc" stroke-width="0.6">
    <path d="M4 20h8M4 44h8M14 20h8M14 44h8M42 20h8M42 44h8M52 20h8M52 44h8"/>
  </g>
  <rect x="6" y="30" width="52" height="4" fill="#94a3b8" stroke="#334155" stroke-width="0.8"/>
  <path d="M8 28v8M18 28v8M46 28v8M56 28v8" stroke="#334155" stroke-width="1.2"/>
  <rect x="28" y="10" width="8" height="44" rx="3" fill="#e2e8f0" stroke="#334155" stroke-width="1"/>
  <rect x="24" y="22" width="16" height="6" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="0.8"/>
  <rect x="25" y="40" width="14" height="5" rx="2" fill="#cbd5e1" stroke="#334155" stroke-width="0.8"/>
  <circle cx="32" cy="12" r="2" fill="#06b6d4"/>
</svg>`

export function createIssIcon(bearing = 0) {
  return L.divIcon({
    className: 'iss-icon',
    html: `<div class="iss-icon__halo"></div><div class="iss-icon__body" style="transform:rotate(${bearing.toFixed(1)}deg)">${ISS_SVG}</div>`,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  })
}
