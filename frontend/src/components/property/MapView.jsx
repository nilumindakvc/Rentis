import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Vite bundles Leaflet's default marker image URLs incorrectly unless we
// override them explicitly with the imported, hashed asset paths.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = defaultIcon

const DEFAULT_CENTER = [6.9271, 79.8612] // Colombo, used when no markers/center given
const DEFAULT_ZOOM = 12

function ClickCapture({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng)
    },
  })
  return null
}

export default function MapView({
  markers = [],
  center,
  zoom = DEFAULT_ZOOM,
  height = 360,
  onMapClick,
  renderPopup,
}) {
  const resolvedCenter = useMemo(() => {
    if (center) return center
    if (markers.length > 0) return [markers[0].lat, markers[0].lng]
    return DEFAULT_CENTER
  }, [center, markers])

  return (
    <div className="leaflet-map" style={{ height }}>
      <MapContainer
        center={resolvedCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickCapture onMapClick={onMapClick} />}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>{renderPopup ? renderPopup(m) : m.title}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
