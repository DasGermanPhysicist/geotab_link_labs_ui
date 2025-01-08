import React, { useState } from 'react';
import { Search, Battery, Thermometer, Box, Bell, MapPin, Clock, Activity } from 'lucide-react';
import { Map } from './components/Map';
import { BatteryTimeline } from './components/BatteryTimeline';
import { TimelineChart } from './components/TimelineChart';
import { UplinkTransactions } from './components/UplinkTransactions';
import { BLEAssetsList } from './components/BLEAssetsList';
import { AlertsSection } from './components/AlertsSection';
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
    battery: 78,
    lastUpdate: '2024-03-14 15:25:18',
    bleAssets: []
  }
];

function App() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '60d'>('24h');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-[#004780]">Link Labs</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="search"
                placeholder="Search assets..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#87B812]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
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
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Asset Trackers</h2>
            {mapMarkers.map((asset, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg mb-3 cursor-pointer hover:border-[#87B812]"
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{asset.name}</h3>
                  <span className="text-sm text-gray-500">{asset.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{asset.position[0].toFixed(4)}°N, {asset.position[1].toFixed(4)}°W</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-[#87B812]" />
                    <span>{asset.battery}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-[#004780]" />
                    <span>{asset.temperature}°F</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-gray-500" />
                    <span>{asset.bleAssets.length} BLE Assets</span>
                  </div>
                  <div className="col-span-2 text-xs text-gray-500">
                    Last Update: {asset.lastUpdate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 p-4">
            {/* Map Section */}
            <div className="bg-gray-100 rounded-lg p-4 h-[400px]">
              <h2 className="font-semibold mb-2">Asset Location Map</h2>
              <div className="bg-white h-full rounded-lg border border-gray-200">
                <Map center={mapMarkers[0].position} markers={mapMarkers} />
              </div>
            </div>

            {/* Uplink Transactions Section */}
            <div className="bg-gray-100 rounded-lg p-4 h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Uplink Transactions</h2>
              </div>
              <UplinkTransactions timeRange={timeRange} />
            </div>
          </div>

          {/* Timeline Section */}
          <div className="p-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <h2 className="font-semibold mb-4">24-Hour Activity Timeline</h2>
              <div className="bg-white h-48 rounded-lg border border-gray-200">
                <TimelineChart timeRange={timeRange} />
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="p-4">
            <AlertsSection />
          </div>

          {/* KPI Section */}
          <div className="grid grid-cols-2 gap-4 p-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Time in Motion</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-2xl font-bold text-[#004780]">
                  <Clock className="w-6 h-6" />
                  <span>8.5 hrs</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Total Dwell Time</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-2xl font-bold text-[#87B812]">
                  <Activity className="w-6 h-6" />
                  <span>15.5 hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Battery Timeline */}
          <div className="p-4">
            <BatteryTimeline />
          </div>

          {/* BLE Assets List */}
          <div className="p-4">
            <BLEAssetsList assets={mapMarkers} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;