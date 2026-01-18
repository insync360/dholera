# Supabase Setup Guide

## Database Connected ✅

**Project**: dholera  
**URL**: https://qwskiyterqppbbxcdggi.supabase.co  
**Region**: ap-south-1 (Mumbai)

## Database Schema

### Tables Created

1. **parcels** - Plot/parcel data
   - Columns: id, parcel_id, status, area_sq_m, price, coordinates, images, notes, documents, description, landmark_distance, size_category
   - RLS: Public read, authenticated write

2. **user_profiles** - User roles and permissions
   - Columns: id, email, role (Admin/Editor/Viewer)
   - RLS: Anonymous read (for login), authenticated full access

3. **data_versions** - Version history tracking
   - Columns: id, version_id, date, publisher, parcels_changed, thumbnail
   - RLS: Public read, authenticated write

4. **upload_history** - KML upload records
   - Columns: id, timestamp, filename, parcel_count, user_email, status
   - RLS: Authenticated read/write

## Sample Data

5 sample parcels have been inserted:
- P-001: Available, 4000 sq.m, ₹1.2Cr (Medium)
- P-002: Reserved, 2500 sq.m, ₹75L (Small)
- P-003: Sold, 6000 sq.m, ₹1.8Cr (Large)
- P-004: Available, 3500 sq.m, ₹1.05Cr (Medium)
- P-005: Available, 1800 sq.m, ₹54L (Small)

## Authentication Setup

### Create Your First User

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qwskiyterqppbbxcdggi
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter:
   - Email: `admin@gapgroup.com`
   - Password: `your-secure-password`
   - Auto Confirm User: ✅ (check this)
5. Click **Create user**

### Login to the App

1. Run `npm run dev`
2. Click **Login** button
3. Enter credentials:
   - Email: `admin@gapgroup.com`
   - Password: `your-secure-password`
4. First login will auto-create an Admin profile

## Environment Variables

Already configured in `.env`:
```env
VITE_SUPABASE_URL=https://qwskiyterqppbbxcdggi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Integration

All API calls now use Supabase:
- ✅ `parcelApi.getAll()` - Fetch parcels from database
- ✅ `parcelApi.update()` - Update parcel data
- ✅ `authApi.login()` - Supabase Auth login
- ✅ `versionApi.getAll()` - Fetch version history
- ⚠️ `uploadApi.uploadKML()` - Needs Edge Function (placeholder)

## Next Steps

1. **Create a user** in Supabase Dashboard (see above)
2. **Test the app**: `npm run dev`
3. **Login** with your credentials
4. **View parcels** loaded from database
5. **Edit parcels** in admin panel

## Troubleshooting

### Error: "Invalid login credentials"
- Make sure you created the user in Supabase Dashboard
- Check that "Auto Confirm User" was enabled

### Error: "Failed to fetch parcels"
- Verify `.env` file has correct Supabase credentials
- Check browser console for detailed error
- Verify RLS policies are enabled

### No parcels showing
- Run this SQL in Supabase SQL Editor:
  ```sql
  SELECT COUNT(*) FROM parcels;
  ```
- Should return 5 parcels

## Database Migrations Applied

1. `create_parcels_table` - Parcels schema with RLS
2. `create_users_table` - User profiles
3. `create_data_versions_table` - Version tracking
4. `create_upload_history_table` - Upload logs
5. `insert_sample_parcels` - 5 sample plots
6. `fix_user_profiles_rls` - Fixed RLS for login flow

## Security Notes

- RLS (Row Level Security) is enabled on all tables
- Anonymous users can only read parcels
- Authentication required for data modifications
- User profiles auto-created on first login
- First user gets Admin role automatically
