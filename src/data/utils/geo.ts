import { Location } from '../datatypes';

export function findBoundingBox(coords: Location[]): Location[] {
  if (!coords || coords.length === 0) return [];

  const latitudes = coords.map((loc) => loc.latitude);
  const longitudes = coords.map((loc) => loc.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return [
    { latitude: minLat, longitude: minLng },
    { latitude: maxLat, longitude: maxLng },
  ];
}
