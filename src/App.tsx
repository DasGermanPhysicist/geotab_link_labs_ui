import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Map } from './components/Map';
import { AssetList } from './components/AssetList';
import { AssetDetailOverlay } from './components/AssetDetailOverlay';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { QRScanner } from './components/QRScanner';
import { fetchTags, Tag, getTagType, getBatteryInfo, TagTypes } from './lib/api';
import { LatLngTuple } from 'leaflet';
import type { ProcessedMarker } from './types/assets';
import { Menu, X, QrCode, ArrowLeft } from 'lucide-react';
import { isAuthenticated } from './lib/auth';
import { runningInGeotab } from './lib/geotab';

const DEFAULT_POSITION: LatLngTuple = [36.1428, -78.8846];
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

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
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    localStorage.setItem('showMapView', showMapView.toString());
  }, [showMapView]);

  useEffect(() => {
    localStorage.setItem('assetViewType', assetViewType);
  }, [assetViewType]);

  const loadTags = useCallback(async (isBackground: boolean = false) => {
    if (!selectedSiteId) return;
    
    try {
      if (!isBackground) {
        setLoading(true);
      } else {
        setIsBackgroundLoading(true);
      }
      
      const data = await fetchTags(selectedSiteId);
      setTags(data);
      setError(null);
    } catch (err) {
      setError('Failed to load assets');
      console.error(err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      } else {
        setIsBackgroundLoading(false);
      }
    }
  }, [selectedSiteId]);

  useEffect(() => {
    if (authenticated && selectedSiteId) {
      loadTags();
      const intervalId = setInterval(() => loadTags(true), REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [authenticated, selectedSiteId, loadTags]);

  const findSuperTagName = (supertagId: string | null) => {
    if (!supertagId) return null;
    const superTag = tags.find(tag => tag.nodeAddress === supertagId);
    return superTag?.nodeName || null;
  };

  const findLeashedTags = (nodeAddress: string) => {
    return tags.filter(tag => tag.sourceSupertagId === nodeAddress);
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
        name: tag.nodeName || 'Unnamed Asset',
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
          marker.bleAssets.some(asset => (asset.nodeName || '').toLowerCase().includes(searchLower))
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
    setIsDetailExpanded(true);
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
    }
  };

  const handleQRScan = (macAddress: string) => {
    setSearchTerm(macAddress);
    setShowQRScanner(false);
  };

  if (!authenticated) {
    if (runningInGeotab()) {
      return <LoadingScreen onLogin={handleLogin} />;
    } else {
      return <LoginScreen onLogin={handleLogin} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showMapView={showMapView}
        onViewChange={setShowMapView}
        selectedSiteId={selectedSiteId}
        onSiteSelect={setSelectedSiteId}
        showSearchInHeader={false}
      />

      <main className="h-[calc(100vh-73px)] relative">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-73px)]">
              <AssetList 
                assets={filteredMarkers}
                selectedAsset={selectedAsset}
                onAssetSelect={handleAssetSelect}
                assetViewType={assetViewType}
                onAssetViewChange={setAssetViewType}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <Dashboard 
              selectedAsset={selectedAsset}
              markers={filteredMarkers}
              mapConfig={mapConfig}
              onAssetSelect={handleAssetSelect}
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-full">
          {/* List View (shown when no asset is selected) */}
          {!selectedAsset && (
            <div className="h-full flex flex-col">
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Scan QR Code"
                  >
                    <QrCode className="w-5 h-5 text-gray-400 hover:text-[#87B812]" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading && !selectedSiteId && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-xl text-gray-600">Select an organization and site to view assets</div>
                  </div>
                )}

                {loading && selectedSiteId && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-xl text-gray-600">Loading assets...</div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-xl text-red-600">{error}</div>
                  </div>
                )}

                {!loading && !error && selectedSiteId && (
                  <AssetList 
                    assets={filteredMarkers}
                    selectedAsset={selectedAsset}
                    onAssetSelect={handleAssetSelect}
                    assetViewType={assetViewType}
                    onAssetViewChange={setAssetViewType}
                  />
                )}
              </div>
            </div>
          )}

          {/* Map View (shown when an asset is selected) */}
          {selectedAsset && (
            <div className="h-full relative">
              {/* Back button */}
              <button
                onClick={() => setSelectedAsset(null)}
                className="absolute top-4 left-4 z-20 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>

              <Map 
                center={mapConfig.center}
                zoom={mapConfig.zoom}
                markers={[selectedAsset]}
              />

              <AssetDetailOverlay
                asset={selectedAsset}
                isExpanded={isDetailExpanded}
                onToggleExpand={() => setIsDetailExpanded(!isDetailExpanded)}
                allAssets={filteredMarkers}
              />
            </div>
          )}
        </div>
      </main>

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