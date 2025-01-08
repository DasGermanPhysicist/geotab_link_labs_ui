import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { Battery, Wifi, WifiOff, Tag, X } from 'lucide-react';

// Fix for default marker icons in React Leaflet
import L from 'leaflet';

// Create custom colored marker icon
const CustomIcon = L.divIcon({
  className: 'custom-marker',
  html: `<svg width="25" height="41" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0C29.86 0 13.5 16.36 13.5 36.5c0 28.875 36.5 63.5 36.5 63.5s36.5-34.625 36.5-63.5C86.5 16.36 70.14 0 50 0z" fill="#87B812"/>
    <circle cx="50" cy="36.5" r="16.5" fill="white"/>
  </svg>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface BLEAsset {
  name: string;
  type: string;
  connected: boolean;
  connectionDate: string;
  leashedTime: string;
  lastUpdate: string;
  battery: number;
}

interface MapMarker {
  position: LatLngTuple;
  name: string;
  type: string;
  temperature: number;
  battery: number;
  lastUpdate: string;
  bleAssets: BLEAsset[];
}

interface MapProps {
  center: LatLngTuple;
  markers: MapMarker[];
}

export function Map({ center, markers }: MapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative h-full">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, index) => (
          <Marker 
            key={index} 
            position={marker.position}
            icon={CustomIcon}
            eventHandlers={{
              click: () => {
                setSelectedMarker(marker);
                setShowModal(true);
              }
            }}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-semibold text-lg mb-2">{marker.name}</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Location:</span>{' '}
                    {marker.position[0].toFixed(4)}°N, {marker.position[1].toFixed(4)}°W
                  </div>
                  <div>
                    <span className="text-gray-600">Last Update:</span> {marker.lastUpdate}
                  </div>
                  <div>
                    <span className="text-gray-600">Temperature:</span> {marker.temperature}°F
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Battery:</span>
                    <Battery className={`w-4 h-4 ${marker.battery > 50 ? 'text-green-500' : 'text-orange-500'}`} />
                    {marker.battery}%
                  </div>
                  <div>
                    <span className="text-gray-600">Leashed Assets:</span> {marker.bleAssets.length}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                    setShowModal(true);
                  }}
                  className="mt-3 w-full bg-[#87B812] text-white px-3 py-1.5 rounded-md hover:bg-[#769f10] transition-colors"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Modal */}
      {showModal && selectedMarker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedMarker.name}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-600">Location:</span>{' '}
                {selectedMarker.position[0].toFixed(4)}°N, {selectedMarker.position[1].toFixed(4)}°W
              </div>
              <div>
                <span className="text-gray-600">Last Update:</span> {selectedMarker.lastUpdate}
              </div>
              <div>
                <span className="text-gray-600">Temperature:</span> {selectedMarker.temperature}°F
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Battery:</span>
                <Battery className={`w-4 h-4 ${selectedMarker.battery > 50 ? 'text-green-500' : 'text-orange-500'}`} />
                {selectedMarker.battery}%
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4">Leashed BLE Assets ({selectedMarker.bleAssets.length})</h3>
            <div className="space-y-4">
              {selectedMarker.bleAssets.map((asset, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {asset.connected ? (
                      <Wifi className="w-5 h-5 text-green-500" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-semibold text-lg">{asset.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span>{asset.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>{' '}
                      {asset.connected ? 'Connected' : 'Disconnected'}
                    </div>
                    <div>
                      <span className="text-gray-600">Connection Date:</span>{' '}
                      {asset.connectionDate}
                    </div>
                    <div>
                      <span className="text-gray-600">Leashed Time:</span>{' '}
                      {asset.leashedTime}
                    </div>
                    <div>
                      <span className="text-gray-600">Last Update:</span>{' '}
                      {asset.lastUpdate}
                    </div>
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${asset.battery > 50 ? 'text-green-500' : 'text-orange-500'}`} />
                      {asset.battery}%
                    </div>
                  </div>
                </div>
              ))}
              {selectedMarker.bleAssets.length === 0 && (
                <p className="text-gray-500 italic">No BLE assets leashed to this tracker</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}