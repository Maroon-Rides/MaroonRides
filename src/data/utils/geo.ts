import { Region } from 'react-native-maps';
import { Location } from '../types';

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

export const defaultMapRegion: Region = {
  latitude: 30.606,
  longitude: -96.3462,
  latitudeDelta: 0.1,
  longitudeDelta: 0.01,
};

// Decodes a polyline that was encoded using Google Maps
export const decodePolyline = (encodedPolyline: string): Location[] => {
  if (!encodedPolyline) return [];

  const decodedCoordinates: Location[] = [];
  let currentIndex = 0;
  const encodedLength = encodedPolyline.length;

  // Track accumulated latitude and longitude values
  let accumulatedLatitude = 0;
  let accumulatedLongitude = 0;

  while (currentIndex < encodedLength) {
    // Decode latitude coordinate
    let encodedChar: number;
    let bitShift = 0;
    let decodedValue = 0;

    // Read characters until we find one without the continuation bit (< 32 after offset)
    do {
      encodedChar = encodedPolyline.charCodeAt(currentIndex) - 63; // Subtract ASCII offset
      decodedValue |= (encodedChar & 31) << bitShift; // Extract 5 data bits and shift
      bitShift += 5;
      currentIndex++;
    } while (encodedChar >= 32); // Continue if continuation bit is set

    // Convert to signed integer: if odd, negate and shift, otherwise just shift
    const latitudeDelta =
      decodedValue & 1 ? ~(decodedValue >> 1) : decodedValue >> 1;
    accumulatedLatitude += latitudeDelta;

    // Decode longitude coordinate (same process as latitude)
    bitShift = 0;
    decodedValue = 0;

    do {
      encodedChar = encodedPolyline.charCodeAt(currentIndex) - 63;
      decodedValue |= (encodedChar & 31) << bitShift;
      bitShift += 5;
      currentIndex++;
    } while (encodedChar >= 32);

    const longitudeDelta =
      decodedValue & 1 ? ~(decodedValue >> 1) : decodedValue >> 1;
    accumulatedLongitude += longitudeDelta;

    // Convert from encoded precision (100000) back to decimal degrees and add to result
    decodedCoordinates.push({
      latitude: accumulatedLatitude / 100000,
      longitude: accumulatedLongitude / 100000,
    });
  }

  return decodedCoordinates;
};
