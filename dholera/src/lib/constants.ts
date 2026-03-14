import { FilterOptions, ParcelStatus } from './types';

export const DHOLERA_MAP_CENTER = { lat: 22.2492, lng: 72.1793 };
export const DHOLERA_MAP_ZOOM = 15;

export const DEFAULT_FILTERS: FilterOptions = {
  areaRange: [0, 10000],
  priceRange: [0, 25000000],
  status: [] as ParcelStatus[],
  sizeCategory: [],
};
