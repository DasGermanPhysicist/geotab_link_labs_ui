import { useState, useRef } from 'react';
import { Map } from '../components/Map';
import { AssetList } from '../components/AssetList';
import { AssetDetailOverlay } from '../components/AssetDetailOverlay';
import { Dashboard } from '../components/Dashboard';
import { QRScanner } from '../components/QRScanner';
import { SuperTagConfiguration } from '../components/SuperTagConfiguration';
import { ProcessedMarker } from '../types/assets';
import { QrCode, ArrowLeft, Search } from 'lucide-react';

interface AssetTrackersPageProps {
  assets: ProcessedMarker[];
  searchTerm: string;
  isLeashedChecked: boolean;
  onLeashedChange: (isChecked: boolean) => void;
  onSearchChange: (term: string) => void;
}

type AssetViewType = 'all' | 'supertags' | 'sensors';

export function AssetTrackersPage({
  assets,
  searchTerm,
  isLeashedChecked,
  onLeashedChange,
  onSearchChange
}: AssetTrackersPageProps) {
  const [selectedAsset, setSelectedAsset] = useState<ProcessedMarker | null>(null);
  const [assetViewType, setAssetViewType] = useState<AssetViewType>(() => 
    (localStorage.getItem('assetViewType') as AssetViewType) || 'all'
  );
  const [showQRScanner, setShowQRScanner]       = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(true);
  const inputRef                                = useRef<HTMLInputElement>(null)

  const handleAssetSelect = (asset: ProcessedMarker | null) => {
    setSelectedAsset(asset);
    setIsDetailExpanded(true);
  };

  const handleQRScan = (macAddress: string) => {
    onSearchChange(macAddress);
    setShowQRScanner(false);
  };

  const mapConfig = {
    center: selectedAsset ? selectedAsset.position : assets[0]?.position ?? [39.8283459, -98.5820546],
    zoom: selectedAsset ? 15 : 13
  };

  function focusSearchBar() {
    inputRef.current?.focus()
  }

  return (
    <main className="h-[calc(100vh-153px)] relative">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full">
        {/* Sidebar */}
        <div className="w-2/10 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="flex border border-gray-200 rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-[#87B812] items-center"
                   tabIndex={0}>
                <input
                  ref={inputRef}
                  type="search"
                  placeholder="Name, MAC Addr, or Serial #"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-11/12 pl-4 pr-4 py-2 rounded-lg focus:outline-none"
                />
                <div className="w-1/12 h-full pr-8 items-center" onClick={focusSearchBar}>
                  <Search className="h-5 text-gray-700"/>
                </div>
              </div>
              <label className="flex justify-between items-center pt-2 pl-1 cursor-pointer">
                <span className="pr-2 text-gray-700">Include Connected Assets</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isLeashedChecked}
                    onChange={(e) => onLeashedChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="block h-6 w-10 rounded-full bg-[#E5E7EB] peer-checked:bg-[#87B812] transition"></div>
                  <div className="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white peer-checked:left-5 transition"></div>
                </div>                  
              </label>
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-75px)]">
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
        <div className="flex-1 h-full overflow-y-auto p-6">
          <Dashboard 
            selectedAsset={selectedAsset}
            markers={assets}
            mapConfig={mapConfig}
            onAssetSelect={handleAssetSelect}
          />
          
          {/* SuperTag Configuration (Desktop) */}
          {selectedAsset && (
            <div className="mt-6">
              <SuperTagConfiguration asset={selectedAsset} />
            </div>
          )}
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
                  placeholder="Search by: Name, MAC Addr, or SN"
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
              <label className="flex justify-between items-center pt-2 pl-1 cursor-pointer">
                <span className="pr-2 text-gray-700">Include Connected Assets</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isLeashedChecked}
                    onChange={(e) => onLeashedChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="block h-6 w-10 rounded-full bg-[#E5E7EB] peer-checked:bg-[#87B812] transition"></div>
                  <div className="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white peer-checked:left-5 transition"></div>
                </div>                  
              </label>
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
    {/* QR Scanner Modal */}
    {showQRScanner && (
      <QRScanner
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
    )}
    </main>
  );
}