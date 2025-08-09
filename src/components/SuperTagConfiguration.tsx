import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings, MapPin, Clock, Navigation } from 'lucide-react';
import { TagRegistrationToken } from '../lib/api';

interface SuperTagConfigurationProps {
  asset: {
    registrationToken: string;
    name: string;
    nodeAddress: string;
    // SuperTag configuration properties with correct API names
    stModeLocUpdateRate_Moving?: string | number;
    stModeLocUpdateRate_Stationary?: string | number;
    sendOnStopWaitTime_s?: string | number;
    gpsOrder?: string | number;
    wifiOrder?: string | number;
    cellOrder?: string | number;
    activeProfile?: string;
    positionSource?: string;
    motionSenseEnable0?: string;
    motionSenseThreshold0?: string | number;
    motionSenseDuration0?: string | number;
  };
}

export function SuperTagConfiguration({ asset }: SuperTagConfigurationProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Only show for SuperTags
  if (asset.registrationToken !== TagRegistrationToken.SUPERTAG) {
    return null;
  }

  // Helper function to format time values
  const formatTimeValue = (value?: string | number, unit: string = 'seconds'): string => {
    if (!value || value === 0 || value === '0') return 'Disabled';
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(numValue) || numValue === 0) return 'Disabled';
    
    if (numValue >= 3600) {
      const hours = Math.floor(numValue / 3600);
      const minutes = Math.floor((numValue % 3600) / 60);
      const seconds = numValue % 60;
      if (minutes === 0 && seconds === 0) return `${hours}h`;
      if (seconds === 0) return `${hours}h ${minutes}m`;
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (numValue >= 60) {
      const minutes = Math.floor(numValue / 60);
      const seconds = numValue % 60;
      if (seconds === 0) return `${minutes}m`;
      return `${minutes}m ${seconds}s`;
    }
    return `${numValue}${unit === 'seconds' ? 's' : unit}`;
  };

  // Parse GPS/WiFi/CellID order based on the three separate order values
  const parseLocationOrder = (): string => {
    const gps = Number(asset.gpsOrder) || 0;
    const wifi = Number(asset.wifiOrder) || 0; 
    const cell = Number(asset.cellOrder) || 0;
    
    // Create array of [source, order] pairs, filter out disabled (0), and sort by order
    const sources = [
      ['GPS', gps],
      ['WiFi', wifi], 
      ['CellID', cell]
    ].filter(([, order]) => order > 0)
     .sort((a, b) => a[1] - b[1]);
    
    // Return the ordered list or 'All Disabled' if no sources are enabled
    if (sources.length === 0) {
      return 'All Disabled';
    }
    
    return sources.map(([source]) => source).join(' → ');
  };

  // Get the most important configuration values
  const locationUpdateRateMoving = formatTimeValue(asset.stModeLocUpdateRate_Moving);
  const locationUpdateRateStationary = formatTimeValue(asset.stModeLocUpdateRate_Stationary);
  const heartbeatInterval = formatTimeValue(asset.stModeHeartbeatInterval);
  const locationOrder = parseLocationOrder();

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <Settings className="w-5 h-5 text-[#87B812]" />
          SuperTag Configuration
        </h2>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Key Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location Update Rates */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-[#87B812]" />
                <span className="text-sm font-medium text-gray-600">ST Mode Location Update Rates</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Moving:</span>
                  <span className="text-lg font-bold text-gray-900">{locationUpdateRateMoving}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stationary:</span>
                  <span className="text-lg font-bold text-gray-900">{locationUpdateRateStationary}</span>
                </div>
              </div>
            </div>

            {/* Heartbeat Interval */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#004780]" />
                <span className="text-sm font-medium text-gray-600">ST Mode Heartbeat Interval</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {heartbeatInterval}
              </div>
            </div>
          </div>

          {/* Send on Stop Wait Time */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#87B812]" />
              <span className="text-sm font-medium text-gray-600">Send on Stop Wait Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTimeValue(asset.sendOnStopWaitTime_s)}
            </div>
          </div>
          {/* Location Source Priority */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Location Priority Order
            </h3>
            <div className="text-lg font-semibold text-blue-800">
              {locationOrder}
            </div>
            <div className="text-sm text-blue-600 mt-2">
              GPS Order: {asset.gpsOrder === 0 || asset.gpsOrder === '0' ? 'Disabled' : asset.gpsOrder || 'Not set'} | 
              WiFi Order: {asset.wifiOrder === 0 || asset.wifiOrder === '0' ? 'Disabled' : asset.wifiOrder || 'Not set'} | 
              CellID Order: {asset.cellOrder === 0 || asset.cellOrder === '0' ? 'Disabled' : asset.cellOrder || 'Not set'}
            </div>
          </div>

          {/* Motion Sensing Configuration */}
          {asset.motionSenseEnable0 === '1' && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">Motion Sensing Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Threshold:</span>
                  <span className="font-mono text-yellow-800">
                    {asset.motionSenseThreshold0 === 0 || asset.motionSenseThreshold0 === '0' ? 'Disabled' : asset.motionSenseThreshold0 || 'Default'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Duration:</span>
                  <span className="font-mono text-yellow-800">
                    {formatTimeValue(asset.motionSenseDuration0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Note */}
          <div className="text-xs text-gray-500 italic">
            To modify configurations, visit apps.airfinder.com or contact Link Labs support.
          </div>
        </div>
      )}
    </div>
  );
}