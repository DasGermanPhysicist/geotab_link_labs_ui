import React, { useState } from 'react';
import { ArrowDownUp, AlertTriangle, Battery, Clock, DoorOpen, Thermometer, Wifi, WifiOff, Box } from 'lucide-react';
import { TagTypes } from '../lib/api';
import type { ProcessedMarker } from '../types/assets';
import { formatLocalDateTime, formatRelativeTime } from '../lib/dateUtils';
import { getTemperatureDisplay } from '../lib/temperature';

interface AssetListProps {
  assets: ProcessedMarker[];
  selectedAsset: ProcessedMarker | null;
  onAssetSelect: (asset: ProcessedMarker | null) => void;
  assetViewType: 'all' | 'supertags' | 'sensors';
  onAssetViewChange: (type: 'all' | 'supertags' | 'sensors') => void;
}

export function AssetList({
  assets,
  selectedAsset,
  onAssetSelect,
  assetViewType,
  onAssetViewChange
}: AssetListProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOption, setSortOption] = useState<'lastSeen' | 'lowBattery' | 'name'>('lastSeen');

  const sortedAssets = [...assets].sort((a, b) => {
    switch (sortOption) {
      case 'lastSeen': {
        const aTime = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
        const bTime = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
        return bTime - aTime;
      }
      case 'lowBattery': {
        if (a.battery.status !== b.battery.status) {
          return a.battery.status === 'Low' ? -1 : 1;
        }
        
        if (a.battery.level !== null && b.battery.level !== null) {
          return a.battery.level - b.battery.level;
        }
        
        if (a.battery.level !== null) return -1;
        if (b.battery.level !== null) return 1;
        
        return 0;
      }
      case 'name':
      default: {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        return aName.localeCompare(bName);
      }
    }
  });

  const shouldShowChargeState = (asset: ProcessedMarker): boolean => {
    const capacity = Number(asset.batteryCapacity_mAh);
    return (capacity === 470 || capacity === 470.0) && asset.chargeState !== undefined;
  };

  // Filter assets based on view type
  const filteredAssets = sortedAssets.filter(asset => {
    if (assetViewType === 'supertags') {
      return asset.registrationToken === TagTypes.SUPERTAG;
    }
    if (assetViewType === 'sensors') {
      return asset.registrationToken !== TagTypes.SUPERTAG;
    }
    return true;
  });

  // Get counts for each type
  const counts = {
    all: assets.length,
    supertags: assets.filter(a => a.registrationToken === TagTypes.SUPERTAG).length,
    sensors: assets.filter(a => a.registrationToken !== TagTypes.SUPERTAG).length
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#87B812]" />
            <h2 className="font-semibold text-gray-700">Asset Trackers</h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#87B812] p-1 rounded-lg hover:bg-gray-50"
            >
              <ArrowDownUp className="w-4 h-4" />
              <span className="hidden md:inline">Sort</span>
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    setSortOption('lastSeen');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    sortOption === 'lastSeen' ? 'text-[#87B812]' : 'text-gray-700'
                  }`}
                >
                  Last Seen
                  {sortOption === 'lastSeen' && <Clock className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setSortOption('lowBattery');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    sortOption === 'lowBattery' ? 'text-[#87B812]' : 'text-gray-700'
                  }`}
                >
                  Low Battery
                  {sortOption === 'lowBattery' && <Battery className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setSortOption('name');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    sortOption === 'name' ? 'text-[#87B812]' : 'text-gray-700'
                  }`}
                >
                  Name (A-Z)
                  {sortOption === 'name' && <ArrowDownUp className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Asset Type Toggle - Grid layout for equal sizing */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onAssetViewChange('all')}
            className={`flex flex-col items-center justify-center px-2 py-2.5 text-sm rounded-lg transition-colors ${
              assetViewType === 'all' 
                ? 'bg-[#87B812] text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">All</span>
            <span className="text-xs mt-0.5 opacity-90">({counts.all})</span>
          </button>
          <button
            onClick={() => onAssetViewChange('supertags')}
            className={`flex flex-col items-center justify-center px-2 py-2.5 text-sm rounded-lg transition-colors ${
              assetViewType === 'supertags' 
                ? 'bg-[#87B812] text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">SuperTags</span>
            <span className="text-xs mt-0.5 opacity-90">({counts.supertags})</span>
          </button>
          <button
            onClick={() => onAssetViewChange('sensors')}
            className={`flex flex-col items-center justify-center px-2 py-2.5 text-sm rounded-lg transition-colors ${
              assetViewType === 'sensors' 
                ? 'bg-[#87B812] text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">Sensors</span>
            <span className="text-xs mt-0.5 opacity-90">({counts.sensors})</span>
          </button>
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {filteredAssets.map((asset, index) => (
            <div
              key={index}
              className={`bg-white border rounded-lg cursor-pointer transition-all duration-200 hover:border-[#87B812] group
                ${asset.alerts?.length ? 'border-l-4 border-l-red-500 border-t border-r border-b border-gray-200' : 'border-gray-200'}
                ${selectedAsset?.macAddress === asset.macAddress ? 'ring-2 ring-[#87B812] ring-opacity-50' : ''}
              `}
              onClick={() => onAssetSelect(asset)}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 group-hover:text-[#004780] transition-colors">
                      {asset.name}
                    </h3>
                    {asset.alerts && asset.alerts.length > 0 && (
                      <div className="relative">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 -top-2 transform -translate-y-full 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                    whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs">
                          Alert
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {asset.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Battery 
                      className={`w-4 h-4 ${
                        asset.battery.status === 'Low' ? 'text-orange-500' : 
                        asset.battery.level !== null ? 
                          (asset.battery.level <= 20 ? 'text-orange-500' : 
                           asset.battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]') 
                        : 'text-[#87B812]'
                      }`} 
                    />
                    <div className="flex flex-col">
                      <span className={`text-sm ${
                        asset.battery.status === 'Low' ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {asset.battery.status === 'Low' ? 'Low' : 
                         asset.battery.level !== null ? `${asset.battery.level}%` : 
                         asset.battery.status}
                      </span>
                      {shouldShowChargeState(asset) && (
                        <span className="text-xs text-gray-500">
                          {asset.chargeState === 'charging' ? 'Charging' :
                           asset.chargeState === 'charge_done' ? 'Charge Complete' :
                           asset.chargeState === 'not_charging' ? 'Not Charging' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {(asset.registrationToken === TagTypes.TEMPERATURE || 
                    asset.registrationToken === TagTypes.SUPERTAG) && asset.temperature !== null && (
                    <div className="flex items-center gap-1.5">
                      <Thermometer className={`w-4 h-4 ${
                        asset.temperature >= 80 ? 'text-red-500' :
                        asset.temperature >= 70 ? 'text-orange-500' : 
                        'text-[#004780]'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {getTemperatureDisplay(asset.temperature)}
                      </span>
                    </div>
                  )}
                </div>

                {asset.registrationToken === TagTypes.DOOR_SENSOR && (
                  <div className="mt-2 flex items-center gap-2">
                    <DoorOpen className={`w-4 h-4 ${
                      asset.doorSensorStatus === 'OPEN' ? 'text-red-500' : 'text-green-500'
                    }`} />
                    <span className="text-sm">{asset.doorSensorStatus || 'Unknown'}</span>
                  </div>
                )}

                {asset.registrationToken === TagTypes.SUPERTAG && asset.bleAssets.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Leashed BLE Assets: {asset.bleAssets.filter(a => {
                      const lastEventTime = new Date(a.lastEventTime).getTime();
                      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
                      return lastEventTime >= twentyFourHoursAgo;
                    }).length}/{asset.bleAssets.length}
                  </div>
                )}

                {asset.registrationToken !== TagTypes.SUPERTAG && asset.leashedToSuperTag && (
                  <div className="mt-2 text-sm text-gray-600">
                    Connected to: {asset.leashedToSuperTag}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500 group-hover/time relative">
                    {formatRelativeTime(asset.lastUpdate)}
                    <span className="hidden md:block absolute left-0 -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded 
                                  opacity-0 group-hover/time:opacity-100 transition-opacity whitespace-nowrap">
                      {formatLocalDateTime(asset.lastUpdate)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No assets found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}