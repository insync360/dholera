export type ParcelStatus = 'Available' | 'Reserved' | 'Sold';

export interface Parcel {
  id: string;
  parcel_id: string;
  status: ParcelStatus;
  area_sq_m: number;
  price: number;
  coordinates: { lat: number; lng: number }[];
  images: string[];
  notes: string;
  documents: { name: string; url: string }[];
  description: string;
  landmark_distance?: string;
  size_category: 'Small' | 'Medium' | 'Large';
}

export interface DataVersion {
  id: string;
  version_id: string;
  date: string;
  publisher: string;
  parcels_changed: number;
  thumbnail?: string;
}

export interface UploadHistory {
  id: string;
  timestamp: string;
  filename: string;
  parcel_count: number;
  user: string;
  status: 'success' | 'error' | 'pending';
}

export interface FilterOptions {
  areaRange: [number, number];
  priceRange: [number, number];
  status: ParcelStatus[];
  sizeCategory: string[];
}

export type UserRole = 'Admin' | 'Editor' | 'Viewer';

export interface User {
  email: string;
  role: UserRole;
}

export interface PublicUser {
  id: string;
  email: string;
}

export interface SiteVisitRequest {
  id: string;
  user_id: string;
  parcel_id: string;
  name: string;
  phone: string;
  requirements?: string;
  status: string;
  created_at: string;
}
