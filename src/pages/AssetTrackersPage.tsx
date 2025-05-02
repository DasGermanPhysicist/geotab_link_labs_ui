import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { Map } from '../components/Map';
import { AssetList } from '../components/AssetList';
import { AssetDetailOverlay } from '../components/AssetDetailOverlay';
import { Dashboard } from '../components/Dashboard';
import { QRScanner } from '../components/QRScanner';
import { ProcessedMarker } from '../types/assets';
import { QrCode, ArrowLeft } from 'lucide-react';

interface AssetTrackersPageProps {
  assets: ProcessedMarker[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedSiteId: string;
  onSiteSelect: (siteId: string) => void;
}

type AssetViewType = 'all' | 'supertags' | 'sensors';

export function AssetTrackersPage({
  assets,
  searchTerm,
  onSearchChange,
  selectedSiteId,
  onSiteSelect
}: AssetTrackersPageProps) {
  const [selectedAsset, setSelectedAsset] = useState<ProcessedMarker | null>(null);
  const [showMapView, setShowMapView] = useState(() => 
    localStorage.getItem('showMapView') === 'true'
  );
  const [assetViewType, setAssetViewType] = useState<AssetViewType>(() => 
    (localStorage.getItem('assetViewType') as AssetViewType) || 'all'
  );
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(true);

  const handleAssetSelect = (asset: ProcessedMarker | null) => {
    setSelectedAsset(asset);
    setIsDetailExpanded(true);
  };

  const handleQRScan = (macAddress: string) => {
    onSearchChange(macAddress);
    setShowQRScanner(false);
  };

  const mapConfig = {
    center: selectedAsset ? selectedAsset.position : assets[0]?.position || [36.1428, -78.8846],
    zoom: selectedAsset ? 15 : 13
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          showMapView={showMapView}
          onViewChange={setShowMapView}
          selectedSiteId={selectedSiteId}
          onSiteSelect={onSiteSelect}
          showSearchInHeader={false}
        />
        <Navigation />
      </div>

      <main className="h-[calc(100vh-125px)] relative">
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
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-73px)]">
              <AssetList 
                assets={assets}
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
              markers={assets}
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
                    onChange={(e) => onSearchChange(e.target.value)}
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
                <AssetList 
                  assets={assets}
                  selectedAsset={selectedAsset}
                  onAssetSelect={handleAssetSelect}
                  assetViewType={assetViewType}
                  onAssetViewChange={setAssetViewType}
                />
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
                allAssets={assets}
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