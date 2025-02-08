import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Map } from './components/Map';
import { AssetList } from './components/AssetList';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { QRScanner } from './components/QRScanner';
import { fetchTags, Tag, getTagType, getBatteryInfo, TagTypes } from './lib/api';
import { LatLngTuple } from 'leaflet';
import type { ProcessedMarker } from './types/assets';
import { Menu, X, QrCode } from 'lucide-react';
import { GeotabLifecycle } from './lib/GeotabLifecycle';
import { isAuthenticated } from './lib/auth';

const DEFAULT_POSITION: LatLngTuple = [36.1428, -78.8846];

type AssetViewType = 'all' | 'supertags' | 'sensors';

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ProcessedMarker | null>(null);
  const [showMapView, setShowMapView] = useState(() => 
    localStorage.getItem('showMapView') === 'true'
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [assetViewType, setAssetViewType] = useState<AssetViewType>(() => 
    (localStorage.getItem('assetViewType') as AssetViewType) || 'all'
  );
  const [showSidebar, setShowSidebar] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    localStorage.setItem('showMapView', showMapView.toString());
  }, [showMapView]);

  useEffect(() => {
    localStorage.setItem('assetViewType', assetViewType);
  }, [assetViewType]);

  useEffect(() => {
    if (authenticated && selectedSiteId) {
      loadTags();
    }
  }, [authenticated, selectedSiteId]);

  useEffect(() => {
    if (window.innerWidth <= 768 && selectedAsset) {
      setShowSidebar(false);
    }
  }, [selectedAsset]);

  const findSuperTagName = (supertagId: string | null) => {
    if (!supertagId) return null;
    const superTag = tags.find(tag => tag.nodeAddress === supertagId);
    return superTag?.name || null;
  };

  const findLeashedTags = (nodeAddress: string) => {
    return tags.filter(tag => tag.sourceSupertagId === nodeAddress);
  };

  const loadTags = async () => {
    if (!selectedSiteId) return;
    
    try {
      setLoading(true);
      const data = await fetchTags(selectedSiteId);
      setTags(data);
      setError(null);
    } catch (err) {
      setError('Failed to load assets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processedMarkers = useMemo(() => {
    return tags.map(tag => {
      const temperature = tag.fahrenheit !== null && tag.fahrenheit !== undefined 
        ? Number(tag.fahrenheit) 
        : null;

      return {
        position: tag.latitude != null && tag.longitude != null
          ? [Number(tag.latitude), Number(tag.longitude)] as LatLngTuple
          : DEFAULT_POSITION,
        name: tag.name || 'Unnamed Asset',
        type: getTagType(tag.registrationToken),
        temperature,
        battery: getBatteryInfo(tag),
        lastUpdate: tag.lastEventTime || new Date().toISOString(),
        bleAssets: findLeashedTags(tag.nodeAddress),
        macAddress: tag.macAddress,
        alerts: tag.alerts,
        doorSensorStatus: tag.doorSensorAlarmStatus,
        leashedToSuperTag: findSuperTagName(tag.sourceSupertagId),
        nodeAddress: tag.nodeAddress,
        registrationToken: tag.registrationToken,
        chargeState: tag.chargeState,
        batteryCapacity_mAh: tag.batteryCapacity_mAh,
        geotabSerialNumber: tag.geotabSerialNumber
      };
    });
  }, [tags]);

  const filteredMarkers = useMemo(() => {
    let result = [...processedMarkers];

    if (assetViewType !== 'all') {
      result = result.filter(marker => {
        if (assetViewType === 'supertags') {
          return marker.registrationToken === TagTypes.SUPERTAG;
        } else {
          return marker.registrationToken !== TagTypes.SUPERTAG;
        }
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(marker => {
        return (
          (marker.name || '').toLowerCase().includes(searchLower) ||
          (marker.type || '').toLowerCase().includes(searchLower) ||
          (marker.macAddress || '').toLowerCase().includes(searchLower) ||
          (marker.doorSensorStatus || '').toLowerCase().includes(searchLower) ||
          (marker.leashedToSuperTag || '').toLowerCase().includes(searchLower) ||
          (marker.geotabSerialNumber || '').toLowerCase().includes(searchLower) ||
          marker.bleAssets.some(asset => (asset.name || '').toLowerCase().includes(searchLower))
        );
      });
    }

    return result;
  }, [processedMarkers, assetViewType, searchTerm]);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const mapConfig = useMemo(() => {
    if (selectedAsset) {
      return {
        center: selectedAsset.position,
        zoom: 15
      };
    }
    return {
      center: filteredMarkers[0]?.position || DEFAULT_POSITION,
      zoom: 13
    };
  }, [selectedAsset, filteredMarkers]);

  const handleAssetSelect = (asset: ProcessedMarker | null) => {
    setSelectedAsset(asset);
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
    }
  };

  const handleQRScan = (macAddress: string) => {
    setSearchTerm(macAddress);
    setShowQRScanner(false);
  };

  // Attempt to initialize Geotab
  if (typeof geotab !== 'undefined') {
    console.log("Running in Geotab Platform: Registering Geotab Event Hooks...")
    geotab.addin.AirfinderStagingAddIn = GeotabLifecycle;
  }

  if (!authenticated) {
    // if (typeof geotab === 'undefined') {
      return <LoginScreen onLogin={handleLogin} />;
    // } else {
    //   return <LoadingScreen onLogin={handleLogin} />;
    // }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map container - positioned absolutely to be behind everything */}
      {!loading && !error && selectedSiteId && showMapView && (
        <div className="fixed inset-0 z-0">
          <Map 
            center={mapConfig.center}
            zoom={mapConfig.zoom}
            markers={selectedAsset ? [selectedAsset] : filteredMarkers}
          />
        </div>
      )}

      {/* Main content wrapper - everything above the map */}
      <div className="relative z-10 flex flex-col h-screen">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showMapView={showMapView}
          onViewChange={setShowMapView}
          selectedSiteId={selectedSiteId}
          onSiteSelect={setSelectedSiteId}
          showSearchInHeader={false}
        />

        {loading && !selectedSiteId && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xl text-gray-600">Select an organization and site to view assets</div>
          </div>
        )}

        {loading && selectedSiteId && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xl text-gray-600">Loading assets...</div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xl text-red-600">{error}</div>
          </div>
        )}

        {!loading && !error && selectedSiteId && (
          <div className="flex-1 flex relative">
            {/* Mobile sidebar toggle button - moved 10% higher */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden fixed bottom-[40%] right-4 z-50 bg-[#87B812] text-white p-3 rounded-full shadow-lg"
            >
              {showSidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <div className={`
              ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              transition-transform duration-300 ease-in-out
              w-full md:w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 
              fixed md:relative z-20 h-full
              shadow-lg md:shadow-none
            `}>
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-12 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                  />
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Scan QR Code"
                  >
                    <QrCode className="w-5 h-5 text-gray-400 hover:text-[#87B812]" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <AssetList 
                  assets={filteredMarkers}
                  selectedAsset={selectedAsset}
                  onAssetSelect={handleAssetSelect}
                  assetViewType={assetViewType}
                  onAssetViewChange={setAssetViewType}
                />
              </div>
            </div>

            {/* Main content - only show if not in map view */}
            {!showMapView && (
              <div className="flex-1 overflow-y-auto p-6 w-full bg-gray-50">
                <Dashboard 
                  selectedAsset={selectedAsset}
                  markers={filteredMarkers}
                  mapConfig={mapConfig}
                  onAssetSelect={handleAssetSelect}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}

export default App;