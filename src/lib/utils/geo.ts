import { maxBy, minBy } from 'lodash-es';
import { type Location } from '../data/types';

export function findBoundingBox(coords: Location[]): Location[] {
  // filter invalid/missing coords & check size (will fail silently -> undef on empty)
  const valid = coords?.filter(
    (coord) => Number.isFinite(coord?.latitude) && Number.isFinite(coord?.longitude),
  );
  if (!valid || valid.length === 0) return [];

  return [
    {
      latitude: minBy(valid, 'latitude')!.latitude,
      longitude: minBy(valid, 'longitude')!.longitude,
    },
    {
      latitude: maxBy(valid, 'latitude')!.latitude,
      longitude: maxBy(valid, 'longitude')!.longitude,
    },
  ];
}
