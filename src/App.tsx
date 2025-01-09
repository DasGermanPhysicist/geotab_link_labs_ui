import React, { useState } from 'react';
import { Search, Battery, Thermometer, Box, Bell, MapPin, Clock, Activity, AlertTriangle, Filter } from 'lucide-react';
import { Map } from './components/Map';
import { BatteryTimeline } from './components/BatteryTimeline';
import { UplinkTransactions } from './components/UplinkTransactions';
import { BLEAssetsList } from './components/BLEAssetsList';
import { AlertsSection } from './components/AlertsSection';
import { AlertTotals } from './components/AlertTotals';
import { LatLngTuple } from 'leaflet';

// Sample data for the map with enhanced information
const mapMarkers = [
  {
    position: [40.7128, -74.0060] as LatLngTuple,
    name: 'Asset Tracker #1',
    type: 'Vehicle Tracker',
    temperature: 72,
    battery: 85,
    lastUpdate: '2024-03-14 15:30:45',
    alerts: ['temperature'],
    bleAssets: [
      {
        name: 'Pallet Tracker 1',
        type: 'Pallet Tag',
        connected: true,
        connectionDate: '2024-03-14 10:30:45',
        leashedTime: '5d 12h',
        lastUpdate: '2024-03-14 15:30:45',
        battery: 85
      },
      {
        name: 'Container 2A',
        type: 'Container Tag',
        connected: true,
        connectionDate: '2024-03-13 08:15:22',
        leashedTime: '6d 19h',
        lastUpdate: '2024-03-14 15:28:33',
        battery: 92
      }
    ]
  },
  {
    position: [40.7148, -74.0068] as LatLngTuple,
    name: 'Asset Tracker #2',
    type: 'Vehicle Tracker',
    temperature: 68,
    battery: 92,
    lastUpdate: '2024-03-14 15:28:33',
    alerts: ['impact'],
    bleAssets: [
      {
        name: 'Box Sensor 3',
        type: 'Package Tag',
        connected: false,
        connectionDate: '2024-03-14 14:45:12',
        leashedTime: '2d 8h',
        lastUpdate: '2024-03-14 14:45:12',
        battery: 45
      }
    ]
  },
  {
    position: [40.7138, -74.0048] as LatLngTuple,
    name: 'Asset Tracker #3',
    type: 'Vehicle Tracker',
    temperature: 70,
    battery: 15,
    lastUpdate: '2024-03-14 15:25:18',
    alerts: ['battery'],
    bleAssets: []
  }
];

function App() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '60d'>('24h');
  const [showMapView, setShowMapView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    group: '',
    field1: '',
    field2: ''
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-[60]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-[#004780]">Link Labs</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search assets..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                />
              </div>
              <div className="relative" style={{ zIndex: 100 }}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-[#87B812] transition-colors"
                >
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span>Filter</span>
                </button>
                {/* Filter Dropdown */}
                {showFilters && (
                  <div className="fixed mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-[280px] grid gap-3" style={{ zIndex: 1000 }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                      >
                        <option value="">All Categories</option>
                        <option value="vehicles">Vehicles</option>
                        <option value="containers">Containers</option>
                        <option value="pallets">Pallets</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                      <select
                        value={filters.group}
                        onChange={(e) => setFilters({ ...filters, group: e.target.value })}
                        className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                      >
                        <option value="">All Groups</option>
                        <option value="group1">Group 1</option>
                        <option value="group2">Group 2</option>
                        <option value="group3">Group 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field 1</label>
                      <select
                        value={filters.field1}
                        onChange={(e) => setFilters({ ...filters, field1: e.target.value })}
                        className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                      >
                        <option value="">All Field 1</option>
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                        <option value="option3">Option 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field 2</label>
                      <select
                        value={filters.field2}
                        onChange={(e) => setFilters({ ...filters, field2: e.target.value })}
                        className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                      >
                        <option value="">All Field 2</option>
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                        <option value="option3">Option 3</option>
                      </select>
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

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Asset List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto sticky top-[64px] h-[calc(100vh-64px)]">
          <div className="p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Asset Trackers</h2>
            <div className="space-y-3">
              {mapMarkers.map((asset, index) => (
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
              <Map center={mapMarkers[0].position} markers={mapMarkers} />
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Map and Uplink Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Map Section */}
                <div className="bg-white rounded-lg shadow-sm p-4 h-[400px]">
                  <h2 className="font-semibold mb-2">Asset Location Map</h2>
                  <div className="h-full rounded-lg border border-gray-200">
                    <Map center={mapMarkers[0].position} markers={mapMarkers} />
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
                <BLEAssetsList assets={mapMarkers} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;