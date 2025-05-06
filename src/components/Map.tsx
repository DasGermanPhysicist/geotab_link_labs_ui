import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Battery, Tag, X, ChevronRight, Map as MapIcon, ExternalLink, History } from 'lucide-react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { TagTypes } from '../lib/api';
import { formatLocalDateTime, formatRelativeTime } from '../lib/dateUtils';
import { getTemperatureDisplay } from '../lib/temperature';
import type { ProcessedMarker } from '../types/assets';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom colored marker icon
const CustomIcon = L.divIcon({
  className: 'll_leaflet-marker-icon',
  html: `<svg width="25" height="41" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0C29.86 0 13.5 16.36 13.5 36.5c0 28.875 36.5 63.5 36.5 63.5s36.5-34.625 36.5-63.5C86.5 16.36 70.14 0 50 0z" fill="#87B812"/>
    <circle cx="50" cy="36.5" r="16.5" fill="white"/>
  </svg>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Selected marker icon with different color
const SelectedIcon = L.divIcon({
  className: 'll_leaflet-marker-icon',
  html: `<svg width="25" height="41" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0C29.86 0 13.5 16.36 13.5 36.5c0 28.875 36.5 63.5 36.5 63.5s36.5-34.625 36.5-63.5C86.5 16.36 70.14 0 50 0z" fill="#004780"/>
    <circle cx="50" cy="36.5" r="16.5" fill="white"/>
  </svg>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Create custom cluster icon
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
  const sizeMap = {
    small: { width: 30, height: 30, fontSize: 12 },
    medium: { width: 35, height: 35, fontSize: 13 },
    large: { width: 40, height: 40, fontSize: 14 }
  };

  return L.divIcon({
    html: `<div class="ll_custom-marker-cluster" style="
      width: ${sizeMap[size].width}px;
      height: ${sizeMap[size].height}px;
      background-color: #87B812;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${sizeMap[size].fontSize}px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">${count}</div>`,
    className: 'll_custom-marker-cluster',
    iconSize: L.point(sizeMap[size].width, sizeMap[size].height),
    iconAnchor: [sizeMap[size].width / 2, sizeMap[size].height / 2]
  });
};

interface MapProps {
  center: LatLngTuple;
  markers: ProcessedMarker[];
  zoom?: number;
  selectedAsset?: ProcessedMarker | null;
}

const formatCoordinate = (coord: number | undefined | null): string => {
  if (typeof coord !== 'number' || isNaN(coord)) {
    return '0.0000';
  }
  return coord.toFixed(4);
};

const isValidPosition = (position: LatLngTuple): boolean => {
  return Array.isArray(position) && 
         position.length === 2 && 
         typeof position[0] === 'number' && 
         typeof position[1] === 'number' && 
         !isNaN(position[0]) && 
         !isNaN(position[1]) &&
         position[0] >= -90 && position[0] <= 90 &&
         position[1] >= -180 && position[1] <= 180;
};

// Create a Google Maps URL from latitude and longitude
const createGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

// Component to handle map view updates
function MapUpdater({ center, zoom, selectedAsset }: { 
  center: LatLngTuple; 
  zoom: number;
  selectedAsset: ProcessedMarker | null | undefined;
}) {
  const map = useMap();
  const lastUpdate = useRef({ center, zoom, selectedAsset: null as ProcessedMarker | null | undefined });

  useEffect(() => {
    if (!map) return;

    const shouldUpdate = 
      selectedAsset !== lastUpdate.current.selectedAsset ||
      center !== lastUpdate.current.center ||
      zoom !== lastUpdate.current.zoom;

    if (shouldUpdate) {
      if (selectedAsset && isValidPosition(selectedAsset.position)) {
        map.setView(selectedAsset.position, 15, {
          animate: true,
          duration: 1
        });
      } else if (isValidPosition(center)) {
        map.setView(center, zoom, {
          animate: true,
          duration: 1
        });
      }

      lastUpdate.current = { center, zoom, selectedAsset };
    }
  }, [map, center, zoom, selectedAsset]);

  return null;
}

export function Map({ center, markers, zoom = 13, selectedAsset }: MapProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  const [mapType, setMapType] = useState<'street' | 'terrain' | 'satellite'>(() => {
    const savedMapType = localStorage.getItem('mapType');
    return (savedMapType as 'street' | 'terrain' | 'satellite') || 'street';
  });
  const navigate = useNavigate();

  const validMarkers = markers.filter(marker => isValidPosition(marker.position));
  const defaultCenter: LatLngTuple = [0, 0];
  const validCenter = isValidPosition(center) ? center : defaultCenter;

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (selectedAsset && mapRef.current && isValidPosition(selectedAsset.position)) {
      const marker = markerRefs.current[selectedAsset.macAddress];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedAsset]);

  // Save map type to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mapType', mapType);
  }, [mapType]);

  const getBatteryDisplay = (battery: { status: 'OK' | 'Low'; level: number | null }) => {
    if (!battery) return 'Unknown';
    if (battery.status === 'Low') return 'Low';
    return battery.level !== null ? `${battery.level}%` : battery.status;
  };

  const getBatteryColor = (battery: { status: 'OK' | 'Low'; level: number | null }) => {
    if (!battery) return 'text-gray-400';
    if (battery.status === 'Low') return 'text-orange-500';
    if (battery.level !== null) {
      return battery.level <= 20 ? 'text-orange-500' : 
             battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]';
    }
    return 'text-[#87B812]';
  };

  const shouldShowChargeState = (marker: ProcessedMarker): boolean => {
    const capacity = Number(marker.batteryCapacity_mAh);
    return (capacity === 470 || capacity === 470.0) && marker.chargeState !== undefined;
  };

  const handleViewLocationHistory = () => {
    if (selectedAsset?.nodeAddress) {
      navigate(`/location-history/${selectedAsset.nodeAddress}`);
    }
  };

  return (
    <div className="relative h-full [&_.ll_leaflet-control-container]:z-[5]">
      <MapContainer 
        center={validCenter}
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        whenReady={(map) => handleMapReady(map.target)}
        zoomControl={false}
        className="ll_leaflet-container"
      >
        {mapReady && (
          <>
            <MapUpdater center={validCenter} zoom={zoom} selectedAsset={selectedAsset} />
            
            <div className="ll_leaflet-control-container">
              <div className="leaflet-top leaflet-right">
                <div className="leaflet-control-zoom leaflet-bar leaflet-control"></div>
              </div>
            </div>

            {/* Desktop layer control */}
            <div className="hidden md:block">
              <LayersControl position="topright" className="ll_leaflet-control-layers">
                <LayersControl.BaseLayer checked={mapType === 'street'} name="Street">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer checked={mapType === 'terrain'} name="Terrain">
                  <TileLayer
                    attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    maxZoom={17}
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer checked={mapType === 'satellite'} name="Satellite">
                  <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
            </div>

            {/* Mobile map type toggle */}
            <div className="md:hidden absolute bottom-24 right-4 z-[400]">
              <button
                onClick={() => {
                  const nextType = mapType === 'street' 
                    ? 'terrain' 
                    : mapType === 'terrain' 
                      ? 'satellite' 
                      : 'street';
                  setMapType(nextType);
                }}
                className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2"
              >
                <MapIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">
                  {mapType === 'street' ? 'Terrain' : mapType === 'terrain' ? 'Satellite' : 'Street'}
                </span>
              </button>
            </div>

            {/* Mobile-specific layers */}
            <div className="md:hidden">
              {mapType === 'street' && (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              )}
              {mapType === 'terrain' && (
                <TileLayer
                  attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  maxZoom={17}
                />
              )}
              {mapType === 'satellite' && (
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              )}
            </div>

            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
            >
              {validMarkers.map((marker, index) => (
                <Marker 
                  key={`${marker.macAddress}-${index}`}
                  position={marker.position}
                  icon={selectedAsset?.macAddress === marker.macAddress ? SelectedIcon : CustomIcon}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[marker.macAddress] = ref;
                    }
                  }}
                >
                  <Popup className="ll_leaflet-popup">
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-semibold text-lg mb-2">{marker.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Location:</span>{' '}
                          {formatCoordinate(marker.position[0])}°N, {formatCoordinate(marker.position[1])}°W
                          <a 
                            href={createGoogleMapsUrl(marker.position[0], marker.position[1])} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 ml-2 text-[#87B812] hover:text-[#004780] transition-colors"
                            title="Open in Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="text-xs">Maps</span>
                          </a>
                        </div>
                        <div className="group/time relative">
                          <span className="text-gray-600">Last Update:</span>{' '}
                          <span>{formatRelativeTime(marker.lastUpdate)}</span>
                          <span className="hidden md:block absolute left-0 -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded 
                                       opacity-0 group-hover/time:opacity-100 transition-opacity whitespace-nowrap">
                            {formatLocalDateTime(marker.lastUpdate)}
                          </span>
                        </div>
                        {(marker.registrationToken === TagTypes.TEMPERATURE || 
                          marker.registrationToken === TagTypes.SUPERTAG) && (
                          <div>
                            <span className="text-gray-600">Temperature:</span>{' '}
                            {getTemperatureDisplay(marker.temperature)}
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Battery:</span>
                            <Battery className={`w-4 h-4 ${getBatteryColor(marker.battery)}`} />
                            {getBatteryDisplay(marker.battery)}
                          </div>
                          {shouldShowChargeState(marker) && (
                            <div className="text-xs text-gray-600 ml-14">
                              {marker.chargeState === 'charging' ? 'Charging' :
                               marker.chargeState === 'charge_done' ? 'Charge Complete' :
                               marker.chargeState === 'not_charging' ? 'Not Charging' : ''}
                            </div>
                          )}
                        </div>
                        {marker.registrationToken === TagTypes.SUPERTAG ? (
                          <div>
                            <span className="text-gray-600">Leashed Assets:</span> {marker.bleAssets.length}
                          </div>
                        ) : marker.leashedToSuperTag ? (
                          <div>
                            <span className="text-gray-600">Connected to SuperTag:</span>{' '}
                            <span className="text-[#87B812]">{marker.leashedToSuperTag}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </>
        )}
      </MapContainer>

      {/* Floating Location History Button */}
      {selectedAsset && selectedAsset.nodeAddress && (
        <button
          onClick={handleViewLocationHistory}
          className="absolute left-1/2 transform -translate-x-1/2 bottom-8 z-[500] bg-[#004780] hover:bg-[#003d6f] text-white font-medium py-3 px-6 rounded-full shadow-xl flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004780] animate-pulse"
          style={{animation: 'pulse 2s infinite'}}
        >
          <History className="w-5 h-5" />
          <span>View Location History</span>
        </button>
      )}
    </div>
  );
}