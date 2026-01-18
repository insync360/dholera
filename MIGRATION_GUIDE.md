# Migration Guide: Mock Data to Real API

## What Changed

The application has been updated to remove mock data and integrate with a real backend API.

## Changes Made

### 1. **Removed Mock Data**
- Deleted dependency on `mockData.ts` for parcels, versions, and upload history
- All data now comes from API endpoints

### 2. **Created API Service Layer** (`src/lib/api.ts`)
- `parcelApi` - CRUD operations for parcels
- `uploadApi` - KML file upload and history
- `versionApi` - Version management
- `authApi` - Authentication

### 3. **Added Environment Configuration**
- `.env` file for API configuration
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key

### 4. **Updated Components**
- **App.tsx**: Now fetches data from API on mount
- **UploadKML.tsx**: Integrated with real upload API
- Added loading states and error handling throughout

### 5. **New Features**
- Loading spinner while fetching data
- Error messages with retry functionality
- Proper authentication with JWT tokens
- Real-time data updates after mutations

## Installation Steps

### 1. Install Missing TypeScript Types
```bash
npm install --save-dev @types/react @types/react-dom @types/node
```

### 2. Fix Import Aliases
The imports use version-specific aliases (e.g., `sonner@2.0.3`). Update them:

**Option A: Fix imports globally**
```bash
# Find and replace in all files
# Change: from 'sonner@2.0.3'
# To: from 'sonner'
```

**Option B: Update vite.config.ts** (Already configured)
The aliases in `vite.config.ts` should handle this automatically.

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and update:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api  # Your backend URL
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY
```

### 4. Install Dependencies (if needed)
```bash
npm install
```

## Backend API Requirements

Your backend needs to implement these endpoints:

### Parcels API
```
GET    /api/parcels              - Get all parcels
GET    /api/parcels/:id          - Get parcel by ID
POST   /api/parcels              - Create new parcel
PUT    /api/parcels/:id          - Update parcel
DELETE /api/parcels/:id          - Delete parcel
GET    /api/parcels/search?q=... - Search parcels
```

### Upload API
```
POST   /api/upload/kml           - Upload KML/KMZ file
GET    /api/upload/history       - Get upload history
```

### Version API
```
GET    /api/versions             - Get all versions
GET    /api/versions/:id         - Get version by ID
POST   /api/versions/:id/rollback - Rollback to version
```

### Auth API
```
POST   /api/auth/login           - Login (returns { user, token })
POST   /api/auth/logout          - Logout
GET    /api/auth/me              - Get current user
```

## Expected Response Formats

### Parcel Object
```json
{
  "id": "1",
  "parcel_id": "P-001",
  "status": "Available",
  "area_sq_m": 4000,
  "price": 12000000,
  "coordinates": [
    { "lat": 22.2492, "lng": 72.1793 },
    { "lat": 22.2492, "lng": 72.1803 }
  ],
  "images": [],
  "notes": "Prime location",
  "documents": [
    { "name": "Land Registry.pdf", "url": "#" }
  ],
  "description": "Premium plot",
  "landmark_distance": "2 km from Metro",
  "size_category": "Medium"
}
```

### Upload Response
```json
{
  "parcel_count": 45,
  "parcels": [/* array of parcel objects */]
}
```

### Auth Response
```json
{
  "user": {
    "email": "admin@gapgroup.com",
    "role": "Admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Testing Without Backend

If you don't have a backend yet, you can:

1. **Keep Demo Mode**: The app starts in demo mode by default
2. **Mock the API**: Create a mock server using tools like:
   - [JSON Server](https://github.com/typicode/json-server)
   - [MSW (Mock Service Worker)](https://mswjs.io/)
   - [Mirage JS](https://miragejs.com/)

## Error Handling

The app now handles these error scenarios:
- Network failures (shows error message with retry)
- API errors (displays error toast)
- Authentication failures (redirects to login)
- Upload failures (shows error message)

## Next Steps

1. **Install TypeScript types** (see step 1 above)
2. **Build your backend API** following the endpoint specifications
3. **Update `.env`** with your API URL
4. **Test the integration** by running `npm run dev`
5. **Remove demo mode** once backend is ready (set `useDemoMode` to false in App.tsx)

## Troubleshooting

### TypeScript Errors
Run: `npm install --save-dev @types/react @types/react-dom`

### CORS Issues
Ensure your backend allows requests from `http://localhost:3000`

### API Connection Failed
- Check `VITE_API_BASE_URL` in `.env`
- Verify backend is running
- Check browser console for errors

### Authentication Issues
- Ensure backend returns JWT token in login response
- Token is stored in `localStorage` as `auth_token`
- Include token in API requests via headers
