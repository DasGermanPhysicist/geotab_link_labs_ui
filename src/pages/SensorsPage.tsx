import React, { useState } from 'react';
import { SensorList } from '../components/SensorList';
import { ProcessedMarker } from '../types/assets';
import { TagRegistrationToken } from '../lib/api';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface SensorsPageProps {
  assets: ProcessedMarker[];
  searchTerm: string;
}

type ConnectionFilter = 'all' | 'connected' | 'disconnected' | 'inactive';

export function SensorsPage({
  assets,
  searchTerm
}: SensorsPageProps) {
  const [connectionFilter, setConnectionFilter] = useState<ConnectionFilter>('all');

  // Filter out SuperTags and get only sensor devices
  const sensors = assets.filter(asset => 
    asset.registrationToken !== TagRegistrationToken.SUPERTAG
  );

  // Apply connection status filter
  const filterByConnection = (sensors: ProcessedMarker[]) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    return sensors.filter(sensor => {
      const lastEventTime = new Date(sensor.lastUpdate).getTime();

      switch (connectionFilter) {
        case 'connected':
          return lastEventTime >= twentyFourHoursAgo;
        case 'disconnected':
          return lastEventTime < twentyFourHoursAgo && lastEventTime >= ninetyDaysAgo;
        case 'inactive':
          return lastEventTime < ninetyDaysAgo;
        default:
          return true;
      }
    });
  };

  // Filter sensors based on search term and connection status
  const filteredSensors = filterByConnection(
    sensors.filter(sensor => {
      const searchLower = searchTerm.toLowerCase();
      return (
        sensor.name.toLowerCase().includes(searchLower) ||
        sensor.macAddress.toLowerCase().includes(searchLower) ||
        (sensor.leashedToSuperTag || '').toLowerCase().includes(searchLower)
      );
    })
  );

  // Get counts for each status
  const getCounts = () => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    return sensors.reduce((acc, sensor) => {
      const lastEventTime = new Date(sensor.lastUpdate).getTime();
      if (lastEventTime >= twentyFourHoursAgo) {
        acc.connected++;
      } else if (lastEventTime < twentyFourHoursAgo && lastEventTime >= ninetyDaysAgo) {
        acc.disconnected++;
      } else {
        acc.inactive++;
      }
      return acc;
    }, { connected: 0, disconnected: 0, inactive: 0 });
  };

  const counts = getCounts();

  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setConnectionFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                connectionFilter === 'all'
                  ? 'bg-[#87B812] text-white border-[#87B812]'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Sensors
              <span className="text-sm">({sensors.length})</span>
            </button>
            
            <button
              onClick={() => setConnectionFilter('connected')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                connectionFilter === 'connected'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Wifi className="w-4 h-4" />
              Connected
              <span className="text-sm">({counts.connected})</span>
            </button>
            
            <button
              onClick={() => setConnectionFilter('disconnected')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                connectionFilter === 'disconnected'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <WifiOff className="w-4 h-4" />
              Disconnected
              <span className="text-sm">({counts.disconnected})</span>
            </button>
            
            <button
              onClick={() => setConnectionFilter('inactive')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                connectionFilter === 'inactive'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Inactive (&gt;90 days)
              <span className="text-sm">({counts.inactive})</span>
            </button>
          </div>
        </div>
      </div>

      <main className="pb-safe">
        <SensorList 
          sensors={filteredSensors}
          allAssets={assets}
        />
      </main>
    </>
  );
}