import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

const courierIcon = L.divIcon({
  className: "courier-marker",
  html: '<div class="courier-marker-pin">🏍️</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

type CourierLiveMapProps = {
  lat: number;
  lng: number;
};

export function CourierLiveMap({ lat, lng }: CourierLiveMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-full w-full rounded-xl"
      key={`${lat}-${lng}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={courierIcon} />
    </MapContainer>
  );
}