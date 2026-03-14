import { Parcel, DataVersion, UploadHistory, User } from './types';
import { supabase } from './supabase';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to transform database row to Parcel type
function transformParcel(row: Record<string, unknown>): Parcel {
  return {
    id: row.id as string,
    parcel_id: row.parcel_id as string,
    status: row.status as Parcel['status'],
    area_sq_m: Number(row.area_sq_m),
    price: Number(row.price),
    coordinates: (row.coordinates as { lat: number; lng: number }[]) || [],
    images: (row.images as string[]) || [],
    notes: (row.notes as string) || '',
    documents: (row.documents as { name: string; url: string }[]) || [],
    description: (row.description as string) || '',
    landmark_distance: row.landmark_distance as string | undefined,
    size_category: row.size_category as Parcel['size_category'],
  };
}

export const parcelApi = {
  getAll: async (): Promise<Parcel[]> => {
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    return (data || []).map(transformParcel);
  },

  getById: async (id: string): Promise<Parcel> => {
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new ApiError(404, error.message);
    }

    return transformParcel(data);
  },

  create: async (parcel: Omit<Parcel, 'id'>): Promise<Parcel> => {
    const { data, error } = await supabase
      .from('parcels')
      .insert({
        parcel_id: parcel.parcel_id,
        status: parcel.status,
        area_sq_m: parcel.area_sq_m,
        price: parcel.price,
        coordinates: parcel.coordinates,
        images: parcel.images,
        notes: parcel.notes,
        documents: parcel.documents,
        description: parcel.description,
        landmark_distance: parcel.landmark_distance,
        size_category: parcel.size_category,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(400, error.message);
    }

    return transformParcel(data);
  },

  update: async (id: string, parcel: Partial<Parcel>): Promise<Parcel> => {
    const updateData: Record<string, unknown> = {};
    
    if (parcel.parcel_id !== undefined) updateData.parcel_id = parcel.parcel_id;
    if (parcel.status !== undefined) updateData.status = parcel.status;
    if (parcel.area_sq_m !== undefined) updateData.area_sq_m = parcel.area_sq_m;
    if (parcel.price !== undefined) updateData.price = parcel.price;
    if (parcel.coordinates !== undefined) updateData.coordinates = parcel.coordinates;
    if (parcel.images !== undefined) updateData.images = parcel.images;
    if (parcel.notes !== undefined) updateData.notes = parcel.notes;
    if (parcel.documents !== undefined) updateData.documents = parcel.documents;
    if (parcel.description !== undefined) updateData.description = parcel.description;
    if (parcel.landmark_distance !== undefined) updateData.landmark_distance = parcel.landmark_distance;
    if (parcel.size_category !== undefined) updateData.size_category = parcel.size_category;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('parcels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new ApiError(400, error.message);
    }

    return transformParcel(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('parcels')
      .delete()
      .eq('id', id);

    if (error) {
      throw new ApiError(400, error.message);
    }
  },

  search: async (query: string): Promise<Parcel[]> => {
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .or(`parcel_id.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    return (data || []).map(transformParcel);
  },
};

export const uploadApi = {
  uploadKML: async (file: File): Promise<{ parcel_count: number; parcels: Parcel[] }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    const formData = new FormData();
    formData.append('file', file);

    // Get current session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/upload-kml`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, result.error || 'Upload failed');
    }

    return {
      parcel_count: result.parcel_count,
      parcels: (result.parcels || []).map(transformParcel),
    };
  },

  getHistory: async (): Promise<UploadHistory[]> => {
    const { data, error } = await supabase
      .from('upload_history')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    return (data || []).map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      filename: row.filename,
      parcel_count: row.parcel_count,
      user: row.user_email,
      status: row.status,
    }));
  },

  deleteUpload: async (uploadId: string): Promise<void> => {
    // First, get the upload details to find associated parcels
    const { data: upload, error: fetchError } = await supabase
      .from('upload_history')
      .select('filename, timestamp')
      .eq('id', uploadId)
      .single();

    if (fetchError) {
      throw new ApiError(500, fetchError.message);
    }

    // Delete the upload history record
    const { error: deleteError } = await supabase
      .from('upload_history')
      .delete()
      .eq('id', uploadId);

    if (deleteError) {
      throw new ApiError(500, deleteError.message);
    }
  },

  deleteParcelsFromUpload: async (uploadId: string): Promise<number> => {
    // Delete parcels by upload_id (foreign key reference)
    const { data: deletedParcels, error } = await supabase
      .from('parcels')
      .delete()
      .eq('upload_id', uploadId)
      .select();

    if (error) {
      throw new ApiError(500, error.message);
    }

    return deletedParcels?.length || 0;
  },
};

export const versionApi = {
  getAll: async (): Promise<DataVersion[]> => {
    const { data, error } = await supabase
      .from('data_versions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    return (data || []).map(row => ({
      id: row.id,
      version_id: row.version_id,
      date: row.date,
      publisher: row.publisher,
      parcels_changed: row.parcels_changed,
      thumbnail: row.thumbnail,
    }));
  },

  getById: async (id: string): Promise<DataVersion> => {
    const { data, error } = await supabase
      .from('data_versions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new ApiError(404, error.message);
    }

    return {
      id: data.id,
      version_id: data.version_id,
      date: data.date,
      publisher: data.publisher,
      parcels_changed: data.parcels_changed,
      thumbnail: data.thumbnail,
    };
  },

  rollback: async (_versionId: string): Promise<void> => {
    // Rollback logic would need to be implemented
    throw new ApiError(501, 'Version rollback not yet implemented');
  },
};

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ApiError(401, error.message);
    }

    // Get user profile to get role, create if doesn't exist
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id);

    let role: string = 'Viewer';

    // If profile doesn't exist, create it
    if (!profiles || profiles.length === 0) {
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          role: 'Admin', // First user is admin
        })
        .select('role')
        .single();
      
      role = newProfile?.role || 'Admin';
    } else {
      role = profiles[0]?.role || 'Viewer';
    }

    return {
      user: {
        email: data.user.email || '',
        role: role as User['role'],
      },
      token: data.session?.access_token || '',
    };
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new ApiError(500, error.message);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id);

    const role = profiles && profiles.length > 0 ? profiles[0].role : 'Viewer';

    return {
      email: user.email || '',
      role: role as User['role'],
    };
  },
};

export { ApiError };
