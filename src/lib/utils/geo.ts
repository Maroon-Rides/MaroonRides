import { maxBy, minBy } from 'lodash-es';
import { type Location } from '../data/types';

export function findBoundingBox(coords: Location[]): Location[] {
  if (!coords || coords.length === 0) return [];

  return [
    {
      latitude: minBy(coords, 'latitude')!.latitude,
      longitude: minBy(coords, 'longitude')!.longitude,
    },
    {
      latitude: maxBy(coords, 'latitude')!.latitude,
      longitude: maxBy(coords, 'longitude')!.longitude,
    },
  ];
}
