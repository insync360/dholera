import { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { TopBar } from './components/public/TopBar';
import { FilterDrawer } from './components/public/FilterDrawer';
import { ParcelDetailPanel } from './components/public/ParcelDetailPanel';
import { ParcelDetailModal } from './components/public/ParcelDetailModal';
import { MapVisualizer } from './components/public/MapVisualizer';
import { DemoMapVisualizer } from './components/public/DemoMapVisualizer';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/Dashboard';
import { UploadKML } from './components/admin/UploadKML';
import { ParcelEditor } from './components/admin/ParcelEditor';
import { VersionHistory } from './components/admin/VersionHistory';
import { Parcel, FilterOptions, User, DataVersion, UploadHistory } from './lib/types';
import { parcelApi, uploadApi, versionApi, authApi, ApiError } from './lib/api';
import { DHOLERA_MAP_CENTER, DHOLERA_MAP_ZOOM, DEFAULT_FILTERS } from './lib/constants';
import { toast } from 'sonner';

export default function App() {
  const [view, setView] = useState<'public' | 'login' | 'admin'>('public');
  const [adminView, setAdminView] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);
  
  // Public view state
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filteredParcels, setFilteredParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Admin data
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);

  // Load parcels on mount
  useEffect(() => {
    loadParcels();
  }, []);

  // Load parcels from API
  const loadParcels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await parcelApi.getAll();
      setParcels(data);
      setFilteredParcels(data);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to load parcels: ${err.message}` 
        : 'Failed to load parcels. Please check your connection.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load admin data
  const loadAdminData = async () => {
    try {
      const [versionsData, historyData] = await Promise.all([
        versionApi.getAll(),
        uploadApi.getHistory(),
      ]);
      setVersions(versionsData);
      setUploadHistory(historyData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  // Load Google Maps API only if not in demo mode
  useEffect(() => {
    if (useDemoMode) {
      // Skip loading Google Maps API in demo mode
      console.log('🎨 Running in Demo Mode - No API key required!');
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      return;
    }

    // Get Google Maps API key from environment variables
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      console.warn('⚠️ Google Maps API key not configured. Using Demo Mode instead.');
      console.warn('📖 See SETUP.md for instructions to enable full Google Maps integration');
      setUseDemoMode(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=drawing,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setMapsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps API - Switching to Demo Mode');
      toast.error('Failed to load Google Maps. Switched to Demo Mode.');
      setUseDemoMode(true);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup is handled by the script itself
    };
  }, [useDemoMode]);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...parcels];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.parcel_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Area filter
    filtered = filtered.filter(
      (p) => p.area_sq_m >= filters.areaRange[0] && p.area_sq_m <= filters.areaRange[1]
    );

    // Price filter
    filtered = filtered.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((p) => filters.status.includes(p.status));
    }

    // Size category filter
    if (filters.sizeCategory.length > 0) {
      filtered = filtered.filter((p) => filters.sizeCategory.includes(p.size_category));
    }

    setFilteredParcels(filtered);
    setIsFilterOpen(false);
    toast.success(`Found ${filtered.length} parcels`);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
    setFilteredParcels(parcels);
    setIsFilterOpen(false);
    toast.info('Filters reset');
  };

  const handleResetView = () => {
    setSelectedParcel(null);
    resetFilters();
  };

  const handleParcelClick = (parcel: Parcel) => {
    setSelectedParcel(parcel);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { user: userData, token } = await authApi.login(email, password);
      localStorage.setItem('auth_token', token);
      setUser(userData);
      setView('admin');
      await loadAdminData();
      toast.success(`Welcome, ${userData.role}!`);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? 'Invalid credentials. Please try again.'
        : 'Login failed. Please check your connection.';
      toast.error(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('auth_token');
      setUser(null);
      setView('public');
      setAdminView('dashboard');
      toast.info('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem('auth_token');
      setUser(null);
      setView('public');
    }
  };

  const handleParcelUpdate = async (updatedParcel: Parcel) => {
    try {
      const updated = await parcelApi.update(updatedParcel.id, updatedParcel);
      setParcels(parcels.map(p => p.id === updated.id ? updated : p));
      setFilteredParcels(filteredParcels.map(p => p.id === updated.id ? updated : p));
      toast.success('Parcel updated successfully');
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? `Failed to update parcel: ${err.message}`
        : 'Failed to update parcel. Please try again.';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleDeleteUpload = async (uploadId: string, _filename: string) => {
    try {
      // Delete parcels associated with this upload (using upload_id foreign key)
      const deletedCount = await uploadApi.deleteParcelsFromUpload(uploadId);
      
      // Delete the upload history record
      await uploadApi.deleteUpload(uploadId);
      
      // Reload data
      await loadParcels();
      await loadAdminData();
      
      toast.success(`Deleted ${deletedCount} parcels and upload record`);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? `Failed to delete upload: ${err.message}`
        : 'Failed to delete upload. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Apply search in real-time
  useEffect(() => {
    if (searchQuery) {
      const filtered = parcels.filter(
        (p) =>
          p.parcel_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredParcels(filtered);
    } else if (filters.status.length === 0 && filters.sizeCategory.length === 0) {
      setFilteredParcels(parcels);
    }
  }, [searchQuery]);

  if (view === 'login') {
    return (
      <>
        <LoginScreen onLogin={handleLogin} onBack={() => setView('public')} />
        <Toaster />
      </>
    );
  }

  if (view === 'admin') {
    return (
      <>
        <AdminLayout
          currentView={adminView}
          onViewChange={setAdminView}
          user={user}
          onLogout={handleLogout}
        >
          {adminView === 'dashboard' && (
            <Dashboard parcels={parcels} uploadHistory={uploadHistory} />
          )}
          {adminView === 'upload' && (
            <UploadKML uploadHistory={uploadHistory} onUploadSuccess={loadParcels} />
          )}
          {adminView === 'editor' && (
            <ParcelEditor parcels={parcels} onParcelUpdate={handleParcelUpdate} />
          )}
          {adminView === 'history' && (
            <VersionHistory 
              versions={versions} 
              uploadHistory={uploadHistory}
              onDeleteUpload={handleDeleteUpload}
            />
          )}
          {adminView === 'settings' && (
            <div className="p-8">
              <h1 className="mb-2">Settings</h1>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </div>
          )}
        </AdminLayout>
        <Toaster />
      </>
    );
  }

  // Public view
  return (
    <>
      <div className="h-screen w-screen overflow-hidden bg-background">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading parcels...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 max-w-md">
            <div className="bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg">
              <p className="font-semibold mb-2">Error</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={loadParcels}
                className="mt-3 text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <TopBar
          onFilterClick={() => setIsFilterOpen(true)}
          onResetView={handleResetView}
          onLoginClick={() => setView('login')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDemoMode={useDemoMode}
          isMobile={isMobile}
        />

        <div className="absolute top-[73px] bottom-0 left-0 right-0">
          {useDemoMode ? (
            <DemoMapVisualizer
              parcels={filteredParcels}
              selectedParcel={selectedParcel}
              onParcelClick={handleParcelClick}
            />
          ) : mapsLoaded ? (
            <MapVisualizer
              parcels={filteredParcels}
              selectedParcel={selectedParcel}
              onParcelClick={handleParcelClick}
              mapCenter={DHOLERA_MAP_CENTER}
              mapZoom={DHOLERA_MAP_ZOOM}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center max-w-2xl px-6">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                <h3 className="mb-2">Loading Google Maps...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Initializing Google Maps API
                </p>
                
                <div className="bg-white rounded-lg p-6 text-left shadow-lg">
                  <h4 className="mb-3 text-destructive">⚠️ API Key Required</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This application requires a Google Maps API key to display the map.
                  </p>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium mb-1">Quick Setup:</div>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Visit <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                        <li>Enable "Maps JavaScript API"</li>
                        <li>Create an API key</li>
                        <li>Open <code className="bg-muted px-1 py-0.5 rounded">/App.tsx</code> and replace <code className="bg-muted px-1 py-0.5 rounded">YOUR_API_KEY_HERE</code></li>
                      </ol>
                    </div>
                    
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        📖 For detailed instructions, see <code className="bg-muted px-1 py-0.5 rounded">SETUP.md</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <ParcelDetailPanel
          parcel={selectedParcel}
          onClose={() => setSelectedParcel(null)}
          onMoreDetails={() => setShowDetailModal(true)}
        />

        <ParcelDetailModal
          parcel={selectedParcel}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      </div>
      
      <Toaster />
    </>
  );
}
