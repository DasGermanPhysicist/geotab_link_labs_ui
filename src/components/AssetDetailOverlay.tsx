import React from 'react';
import { ChevronDown, ChevronUp, Battery, Thermometer, Clock, DoorOpen, Wifi, WifiOff } from 'lucide-react';
import type { ProcessedMarker } from '../types/assets';
import { formatLocalDateTime, formatRelativeTime } from '../lib/dateUtils';
import { TagTypes } from '../lib/api';
import { BLEDevicesList } from './BLEDevicesList';
import { getTemperatureDisplay } from '../lib/temperature';

interface AssetDetailOverlayProps {
  asset: ProcessedMarker;
  isExpanded: boolean;
  onToggleExpand: () => void;
  allAssets: ProcessedMarker[];
}

export function AssetDetailOverlay({ 
  asset, 
  isExpanded, 
  onToggleExpand,
  allAssets 
}: AssetDetailOverlayProps) {
  const getBatteryColor = (battery: { status: 'OK' | 'Low'; level: number | null }) => {
    if (battery.status === 'Low') return 'text-orange-500';
    if (battery.level !== null) {
      return battery.level <= 20 ? 'text-orange-500' : 
             battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]';
    }
    return 'text-[#87B812]';
  };

  const getBatteryDisplay = (battery: { status: 'OK' | 'Low'; level: number | null }) => {
    if (battery.status === 'Low') return 'Low';
    return battery.level !== null ? `${battery.level}%` : battery.status;
  };

  const parentSuperTag = asset.leashedToSuperTag 
    ? allAssets.find(a => a.name === asset.leashedToSuperTag)
    : null;

  return (
    <div 
      className={`md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg transition-transform duration-300 ease-in-out z-20
        ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-64px)]'}`}
      style={{ maxHeight: 'calc(100vh - 73px)' }}
    >
      {/* Header - Always visible */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer border-b border-gray-200"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">{asset.name}</h2>
          <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {asset.type}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-6 h-6 text-gray-400" />
        ) : (
          <ChevronUp className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Expandable content */}
      <div className={`overflow-y-auto ${isExpanded ? 'max-h-[70vh]' : 'h-0'}`}>
        <div className="p-4 space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Battery className={`w-5 h-5 ${getBatteryColor(asset.battery)}`} />
                <span className="font-medium">Battery</span>
              </div>
              <div className="text-2xl font-bold">
                {getBatteryDisplay(asset.battery)}
              </div>
            </div>

            {(asset.registrationToken === TagTypes.TEMPERATURE || 
              asset.registrationToken === TagTypes.SUPERTAG) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className={`w-5 h-5 ${
                    asset.temperature && asset.temperature >= 80 ? 'text-red-500' :
                    asset.temperature && asset.temperature >= 70 ? 'text-orange-500' : 
                    'text-[#004780]'
                  }`} />
                  <span className="font-medium">Temperature</span>
                </div>
                <div className="text-2xl font-bold">
                  {getTemperatureDisplay(asset.temperature)}
                </div>
              </div>
            )}
          </div>

          {/* Door sensor status */}
          {asset.registrationToken === TagTypes.DOOR_SENSOR && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DoorOpen className={`w-5 h-5 ${
                  asset.doorSensorStatus === 'OPEN' ? 'text-red-500' : 'text-green-500'
                }`} />
                <span className="font-medium">Door Status</span>
              </div>
              <div className="text-2xl font-bold">
                {asset.doorSensorStatus || 'Unknown'}
              </div>
            </div>
          )}

          {/* SuperTag connection */}
          {parentSuperTag && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Connected to SuperTag</span>
              </div>
              <div className="text-lg font-medium text-blue-700">
                {parentSuperTag.name}
              </div>
            </div>
          )}

          {/* Connected BLE devices */}
          {asset.registrationToken === TagTypes.SUPERTAG && asset.bleAssets.length > 0 && (
            <BLEDevicesList devices={asset.bleAssets} />
          )}

          {/* Last update time */}
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {formatRelativeTime(asset.lastUpdate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}