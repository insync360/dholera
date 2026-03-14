import { Parcel, DataVersion, UploadHistory } from './types';

// Dholera Smart City approximate coordinates
const DHOLERA_CENTER = { lat: 22.2492, lng: 72.1793 };

export const mockParcels: Parcel[] = [
  {
    id: '1',
    parcel_id: 'P-001',
    status: 'Available',
    area_sq_m: 4000,
    price: 12000000,
    coordinates: [
      { lat: 22.2492, lng: 72.1793 },
      { lat: 22.2492, lng: 72.1803 },
      { lat: 22.2502, lng: 72.1803 },
      { lat: 22.2502, lng: 72.1793 },
    ],
    images: [],
    notes: 'Prime location near proposed metro station',
    documents: [
      { name: 'Land Registry.pdf', url: '#' },
      { name: 'Survey Report.pdf', url: '#' },
    ],
    description: 'Premium plot located in the heart of Dholera Smart City with excellent connectivity and future development potential.',
    landmark_distance: '2 km from Metro Station',
    size_category: 'Medium',
  },
  {
    id: '2',
    parcel_id: 'P-002',
    status: 'Reserved',
    area_sq_m: 2500,
    price: 7500000,
    coordinates: [
      { lat: 22.2502, lng: 72.1793 },
      { lat: 22.2502, lng: 72.1803 },
      { lat: 22.2512, lng: 72.1803 },
      { lat: 22.2512, lng: 72.1793 },
    ],
    images: [],
    notes: 'Reserved for corporate client',
    documents: [
      { name: 'Land Registry.pdf', url: '#' },
    ],
    description: 'Well-positioned plot suitable for commercial development with approved building plans.',
    landmark_distance: '1.5 km from Metro Station',
    size_category: 'Small',
  },
  {
    id: '3',
    parcel_id: 'P-003',
    status: 'Sold',
    area_sq_m: 6000,
    price: 18000000,
    coordinates: [
      { lat: 22.2482, lng: 72.1793 },
      { lat: 22.2482, lng: 72.1803 },
      { lat: 22.2492, lng: 72.1803 },
      { lat: 22.2492, lng: 72.1793 },
    ],
    images: [],
    notes: 'Sold to ABC Industries',
    documents: [
      { name: 'Sale Deed.pdf', url: '#' },
      { name: 'Land Registry.pdf', url: '#' },
    ],
    description: 'Large plot sold for industrial development with direct highway access.',
    landmark_distance: '500 m from Highway',
    size_category: 'Large',
  },
  {
    id: '4',
    parcel_id: 'P-004',
    status: 'Available',
    area_sq_m: 3500,
    price: 10500000,
    coordinates: [
      { lat: 22.2512, lng: 72.1793 },
      { lat: 22.2512, lng: 72.1803 },
      { lat: 22.2522, lng: 72.1803 },
      { lat: 22.2522, lng: 72.1793 },
    ],
    images: [],
    notes: 'Corner plot with dual road access',
    documents: [
      { name: 'Land Registry.pdf', url: '#' },
      { name: 'NOC Certificate.pdf', url: '#' },
    ],
    description: 'Corner plot with excellent visibility and dual road access, ideal for mixed-use development.',
    landmark_distance: '3 km from Business Hub',
    size_category: 'Medium',
  },
  {
    id: '5',
    parcel_id: 'P-005',
    status: 'Available',
    area_sq_m: 1800,
    price: 5400000,
    coordinates: [
      { lat: 22.2472, lng: 72.1793 },
      { lat: 22.2472, lng: 72.1803 },
      { lat: 22.2482, lng: 72.1803 },
      { lat: 22.2482, lng: 72.1793 },
    ],
    images: [],
    notes: 'Affordable investment opportunity',
    documents: [
      { name: 'Land Registry.pdf', url: '#' },
    ],
    description: 'Compact plot perfect for small business or residential development with basic amenities nearby.',
    landmark_distance: '1 km from School',
    size_category: 'Small',
  },
];

export const mockVersions: DataVersion[] = [
  {
    id: '1',
    version_id: 'v1.3.2',
    date: '2025-10-10',
    publisher: 'admin@gapgroup.com',
    parcels_changed: 12,
  },
  {
    id: '2',
    version_id: 'v1.3.1',
    date: '2025-09-28',
    publisher: 'admin@gapgroup.com',
    parcels_changed: 5,
  },
  {
    id: '3',
    version_id: 'v1.3.0',
    date: '2025-09-15',
    publisher: 'editor@gapgroup.com',
    parcels_changed: 23,
  },
];

export const mockUploadHistory: UploadHistory[] = [
  {
    id: '1',
    timestamp: '2025-10-10 14:30:00',
    filename: 'dholera_parcels_oct.kml',
    parcel_count: 45,
    user: 'admin@gapgroup.com',
    status: 'success',
  },
  {
    id: '2',
    timestamp: '2025-09-28 09:15:00',
    filename: 'updated_plots.kmz',
    parcel_count: 38,
    user: 'admin@gapgroup.com',
    status: 'success',
  },
  {
    id: '3',
    timestamp: '2025-09-20 16:45:00',
    filename: 'new_survey.kml',
    parcel_count: 0,
    user: 'editor@gapgroup.com',
    status: 'error',
  },
];

export const DHOLERA_MAP_CENTER = DHOLERA_CENTER;
export const DHOLERA_MAP_ZOOM = 15;
