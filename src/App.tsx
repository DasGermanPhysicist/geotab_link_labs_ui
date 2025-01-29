import React, { useState, useEffect, useMemo } from 'react';
import { Search, Battery, Thermometer, Box, Bell, MapPin, Clock, Activity, AlertTriangle, Filter, DoorOpen, ArrowUpDown } from 'lucide-react';
import { Map } from './components/Map';
import { BatteryTimeline } from './components/BatteryTimeline';
import { UplinkTransactions } from './components/UplinkTransactions';
import { BLEAssetsList } from './components/BLEAssetsList';
import { AlertsSection } from './components/AlertsSection';
import { AlertTotals } from './components/AlertTotals';
import { LoginScreen } from './components/LoginScreen';
import { OrgSiteSelector } from './components/OrgSiteSelector';
import { fetchTags, isAuthenticated, Tag, getTagType, calculateBatteryPercentage, TagTypes } from './lib/api';
import { LatLngTuple } from 'leaflet';

// Default position for the map if no valid coordinates are available
const DEFAULT_POSITION: LatLngTuple = [36.1428, -78.8846];

type SortField = 'name' | 'lastEventTime';
type SortDirection = 'asc' | 'desc';

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Tag | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '60d'>('24h');
  const [showMapView, setShowMapView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagType, setSelectedTagType] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{field: SortField, direction: SortDirection}>({
    field: 'name',
    direction: 'asc'
  });

  useEffect(() => {
    if (authenticated && selectedSiteId) {
      loadTags();
    }
  }, [authenticated, selectedSiteId]);

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
      console.log('Raw tag data from API:', data);
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
    return tags
      .filter(tag => tag.latitude != null && tag.longitude != null)
      .map(tag => ({
        position: [tag.latitude!, tag.longitude!] as LatLngTuple,
        name: tag.name,
        type: getTagType(tag.registrationToken),
        temperature: tag.fahrenheit,
        battery: calculateBatteryPercentage(tag),
        lastUpdate: tag.lastEventTime,
        bleAssets: findLeashedTags(tag.nodeAddress),
        macAddress: tag.macAddress,
        alerts: tag.alerts || [],
        doorSensorStatus: tag.doorSensorAlarmStatus,
        leashedToSuperTag: findSuperTagName(tag.sourceSupertagId),
        nodeAddress: tag.nodeAddress,
        registrationToken: tag.registrationToken,
        sourceSupertagId: tag.sourceSupertagId
      }));
  }, [tags]);

  const filteredAndSortedMarkers = useMemo(() => {
    let result = [...processedMarkers];

    // Apply tag type filter
    if (selectedTagType) {
      result = result.filter(marker => marker.type === selectedTagType);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(marker => {
        return (
          marker.name.toLowerCase().includes(searchLower) ||
          marker.type.toLowerCase().includes(searchLower) ||
          marker.macAddress.toLowerCase().includes(searchLower) ||
          (marker.doorSensorStatus && marker.doorSensorStatus.toLowerCase().includes(searchLower)) ||
          (marker.leashedToSuperTag && marker.leashedToSuperTag.toLowerCase().includes(searchLower)) ||
          marker.bleAssets.some(asset => asset.name.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });

    return result;
  }, [processedMarkers, selectedTagType, searchTerm, sortConfig]);

  const toggleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'temperature':
        return 'text-red-500';
      case 'battery':
        return 'text-orange-500';
      case 'impact':
        return 'text-yellow-500';
      case 'geofence':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getAlertTitle = (alertType: string) => {
    switch (alertType) {
      case 'temperature':
        return 'High Temperature Alert';
      case 'battery':
        return 'Low Battery Alert';
      case 'impact':
        return 'Impact Alert';
      case 'geofence':
        return 'Geofence Alert';
      default:
        return 'Alert';
    }
  };

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-[60]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-[#004780]">Link Labs</h1>
            <div className="flex items-center gap-4">
              <OrgSiteSelector onSiteSelect={setSelectedSiteId} />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                />
              </div>
              <div className="relative" style={{ zIndex: 100 }}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-[#87B812] transition-colors"
                >
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span>Filter by Type</span>
                </button>
                {showFilters && (
                  <div className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-[200px]">
                    <div className="space-y-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="tagType"
                          value=""
                          checked={selectedTagType === ''}
                          onChange={(e) => setSelectedTagType(e.target.value)}
                          className="form-radio text-[#87B812]"
                        />
                        <span className="ml-2">All Types</span>
                      </label>
                      {['SuperTag', 'Door Sensor', 'Temperature Tag', 'BLE Tag'].map((type) => (
                        <label key={type} className="block">
                          <input
                            type="radio"
                            name="tagType"
                            value={type}
                            checked={selectedTagType === type}
                            onChange={(e) => setSelectedTagType(e.target.value)}
                            className="form-radio text-[#87B812]"
                          />
                          <span className="ml-2">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowMapView(false)}
                className={`px-4 py-2 ${!showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setShowMapView(true)}
                className={`px-4 py-2 ${showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
              >
                Map View
              </button>
            </div>
            <select 
              className="border border-gray-200 rounded-lg px-4 py-2"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="60d">Last 60 Days</option>
            </select>
          </div>
        </div>
      </header>

      {loading && !selectedSiteId && (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-xl text-gray-600">Select an organization and site to view assets</div>
        </div>
      )}

      {loading && selectedSiteId && (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading assets...</div>
        </div>
      )}

      {error && (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-xl text-red-600">{error}</div>
        </div>
      )}

      {!loading && !error && selectedSiteId && (
        <div className="flex h-[calc(100vh-64px)]">
          {/* Left Sidebar - Asset List */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto sticky top-[64px] h-[calc(100vh-64px)]">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700">Asset Trackers</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#87B812]"
                  >
                    Name
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleSort('lastUpdate')}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#87B812]"
                  >
                    Time
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {filteredAndSortedMarkers.map((asset, index) => (
                  <div
                    key={index}
                    className={`bg-white border rounded-lg cursor-pointer transition-all duration-200 hover:border-[#87B812] group
                      ${asset.alerts?.length ? 'border-l-4 border-l-red-500' : 'border-gray-200'}
                      ${selectedAsset === asset ? 'ring-2 ring-[#87B812] ring-opacity-50' : ''}
                    `}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="p-3">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 group-hover:text-[#004780] transition-colors">
                            {asset.name}
                          </h3>
                          {asset.alerts && asset.alerts.length > 0 && (
                            <div className="relative group/tooltip">
                              <AlertTriangle 
                                className={`w-4 h-4 ${getAlertColor(asset.alerts[0])}`}
                              />
                              <div className="absolute left-1/2 -translate-x-1/2 -top-2 transform -translate-y-full 
                                            opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200
                                            whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs">
                                {getAlertTitle(asset.alerts[0])}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {asset.type}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-1.5">
                          <Battery 
                            className={`w-4 h-4 ${
                              asset.battery <= 20 ? 'text-orange-500' : 
                              asset.battery <= 50 ? 'text-yellow-500' : 'text-[#87B812]'
                            }`} 
                          />
                          <span className={`text-sm ${
                            asset.battery <= 20 ? 'text-orange-600' : 
                            asset.battery <= 50 ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {asset.battery}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Thermometer className={`w-4 h-4 ${
                            asset.temperature >= 80 ? 'text-red-500' :
                            asset.temperature >= 70 ? 'text-orange-500' : 'text-[#004780]'
                          }`} />
                          <span className="text-sm text-gray-600">{asset.temperature}°F</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Box className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{asset.bleAssets.length}</span>
                        </div>
                      </div>

                      {/* Door Sensor Status */}
                      {asset.registrationToken === TagTypes.DOOR_SENSOR && (
                        <div className="mt-2 flex items-center gap-2">
                          <DoorOpen className={`w-4 h-4 ${
                            asset.doorSensorStatus === 'OPEN' ? 'text-red-500' : 'text-green-500'
                          }`} />
                          <span className="text-sm">{asset.doorSensorStatus || 'Unknown'}</span>
                        </div>
                      )}

                      {/* SuperTag Leashed Assets */}
                      {asset.registrationToken === TagTypes.SUPERTAG && asset.bleAssets.length > 0 && (
                        <div className="mt-2 border-t border-gray-100 pt-2">
                          <span className="text-sm text-gray-600">Leashed Tags:</span>
                          {asset.bleAssets.map((leashedTag, idx) => (
                            <div key={idx} className="text-sm text-gray-700">{leashedTag.name}</div>
                          ))}
                        </div>
                      )}

                      {/* Leashed To SuperTag */}
                      {asset.registrationToken !== TagTypes.SUPERTAG && asset.leashedToSuperTag && (
                        <div className="mt-2 text-sm text-gray-600">
                          Leashed to: {asset.leashedToSuperTag}
                        </div>
                      )}

                      {/* Last Update */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{asset.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {showMapView ? (
              <div className="h-full">
                <Map center={filteredAndSortedMarkers[0]?.position || DEFAULT_POSITION} markers={filteredAndSortedMarkers} />
              </div>
            ) : (
              <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Map and Uplink Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Map Section */}
                  <div className="bg-white rounded-lg shadow-sm p-4 h-[400px]">
                    <h2 className="font-semibold mb-2">Asset Location Map</h2>
                    <div className="h-full rounded-lg border border-gray-200">
                      <Map center={filteredAndSortedMarkers[0]?.position || DEFAULT_POSITION} markers={filteredAndSortedMarkers} />
                    </div>
                  </div>

                  {/* Uplink Transactions Section */}
                  <div className="bg-white rounded-lg shadow-sm p-4 h-[400px] overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold">Recent Uplink Transactions</h2>
                    </div>
                    <div className="h-[calc(100%-2rem)] overflow-y-auto">
                      <UplinkTransactions timeRange={timeRange} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="font-semibold mb-2">Time in Motion</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 text-2xl font-bold text-[#004780]">
                        <Clock className="w-6 h-6" />
                        <span>8.5 hrs</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="font-semibold mb-2">Total Dwell Time</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 text-2xl font-bold text-[#87B812]">
                        <Activity className="w-6 h-6" />
                        <span>15.5 hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="font-semibold mb-4">Alert Totals</h2>
                  <AlertTotals />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <AlertsSection />
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <BatteryTimeline />
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <BLEAssetsList assets={filteredAndSortedMarkers} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;