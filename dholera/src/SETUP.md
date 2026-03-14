# GAP Group Real Estate Platform - Setup Guide

## 🎨 Demo Mode (No API Key Required!)

**Good news!** The application now includes a **Demo Mode** that works immediately without any API key configuration.

### Demo Mode Features:
- ✅ Embedded Google Maps background (Dholera Smart City)
- ✅ Interactive parcel overlays (click, hover, filter)
- ✅ All filtering, search, and detail panel features
- ✅ Admin panel functionality
- ✅ No API key setup required
- ✅ Perfect for quick demos and presentations

**Demo Mode is enabled by default** - just open the application and start exploring!

---

## 🗺️ Full Google Maps Integration (Optional)

For advanced features like custom markers, 3D views, and enhanced map controls, you can optionally configure a Google Maps API key.

### Steps to Configure:

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Library"
   - Search for and enable "Maps JavaScript API"
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your new API key

2. **Update the API Key:**
   - Open `/App.tsx`
   - Find this line (around line 47):
     ```javascript
     const API_KEY = 'YOUR_API_KEY_HERE';
     ```
   - Replace `'YOUR_API_KEY_HERE'` with your actual API key:
     ```javascript
     const API_KEY = 'AIzaSyC-your-actual-api-key-here';
     ```
   - Save the file

3. **Restrict Your API Key (Recommended for Production):**
   - In Google Cloud Console, go to your API key settings
   - Under "Application restrictions":
     - Select "HTTP referrers (websites)"
     - Add your domain (e.g., `your-domain.com/*`)
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose only "Maps JavaScript API"
   - Save changes

4. **Verify Setup:**
   - Refresh your application
   - The map should now load with parcels displayed as colored polygons
   - Click on any parcel to view details

### Troubleshooting:

**Map not loading?**
- Check the browser console for error messages
- Verify your API key is correctly copied (no extra spaces)
- Ensure "Maps JavaScript API" is enabled in Google Cloud Console
- Check if you have billing enabled (Google requires a billing account, but provides free tier usage)

**"InvalidKeyMapError"?**
- Your API key is invalid or not properly configured
- Make sure you've enabled "Maps JavaScript API" specifically
- Try creating a new API key if the issue persists

## Demo Credentials

### Admin Access:
- **Email:** admin@gapgroup.com
- **Password:** demo123
- **Role:** Admin (full access)

### Editor Access:
- **Email:** editor@gapgroup.com
- **Password:** demo123
- **Role:** Editor (edit access)

## Features Overview

### Public View:
- Interactive Google Maps with parcel visualization
- Click parcels to view details
- Filter by area, price, status, and size
- Search by parcel ID or description
- Request site visits
- Share parcel links

### Admin Panel:
- **Dashboard:** Overview of all parcels and activity
- **Upload KML:** Import KML/KMZ files with validation
- **Parcel Editor:** Edit parcel details with live preview
- **Version History:** View and rollback to previous versions
- **Settings:** Configure system settings

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Maps API** - Map visualization
- **Shadcn/ui** - Component library
- **Sonner** - Toast notifications

## Responsive Design

The platform is fully responsive:
- **Desktop (1440px+):** Full split-view with map and panels
- **Tablet (768px-1439px):** Optimized layout
- **Mobile (375px-767px):** Bottom sheet panels and mobile controls

## Mock Data

The application currently uses mock data for demonstration:
- 5 sample parcels in Dholera Smart City
- Upload history records
- Version history
- All data is stored in `/lib/mockData.ts`

## Future Enhancements

Consider integrating:
- **Supabase** for:
  - Real user authentication
  - Persistent data storage
  - File upload handling
  - Real-time collaboration
  - Role-based access control

- **Advanced Features:**
  - 3D building visualization
  - Advanced analytics dashboard
  - Bulk import/export
  - Email notifications
  - Payment integration
  - Document management system
