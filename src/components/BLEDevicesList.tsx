import React, { useState } from 'react';
import { Wifi, WifiOff, Battery, Clock, X, ChevronRight } from 'lucide-react';
import { formatLocalDateTime, formatRelativeTime } from '../lib/dateUtils';
import { getBatteryInfo } from '../lib/api';

interface BLEDevice {
  nodeName: string;
  lastEventTime: string;
  batteryVoltage: string;
  lowVoltageFlag: boolean;
  batteryStatus: number | string;
  batteryCapacity_mAh: number | string;
  batteryConsumed_mAh?: number | string | null;
  batteryUsage_uAh?: number | string | null;
}

interface BLEDevicesListProps {
  devices: BLEDevice[];
}

interface DeviceDetailModalProps {
  device: BLEDevice;
  onClose: () => void;
}

function DeviceDetailModal({ device, onClose }: DeviceDetailModalProps) {
  const batteryInfo = getBatteryInfo(device);
  const isConnected = new Date(device.lastEventTime).getTime() > Date.now() - 24 * 60 * 60 * 1000;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:w-96 md:rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{device.nodeName}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Connection Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-700">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-700">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* Battery Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Battery className={`w-5 h-5 ${
                batteryInfo.status === 'Low' ? 'text-orange-500' :
                batteryInfo.level !== null ?
                  (batteryInfo.level <= 20 ? 'text-orange-500' :
                   batteryInfo.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]')
                : 'text-[#87B812]'
              }`} />
              <span className="font-medium">Battery Status</span>
            </div>
            <div className="text-2xl font-bold">
              {batteryInfo.status === 'Low' ? 'Low' :
               batteryInfo.level !== null ? `${batteryInfo.level}%` :
               batteryInfo.status}
            </div>
          </div>

          {/* Last Update Time */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Last Update</span>
            </div>
            <div>
              <div className="text-lg font-medium">
                {formatRelativeTime(device.lastEventTime)}
              </div>
              <div className="text-sm text-gray-500">
                {formatLocalDateTime(device.lastEventTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BLEDevicesList({ devices }: BLEDevicesListProps) {
  const [selectedDevice, setSelectedDevice] = useState<BLEDevice | null>(null);

  const sortedDevices = [...devices].sort((a, b) => {
    const aConnected = new Date(a.lastEventTime).getTime() > Date.now() - 24 * 60 * 60 * 1000;
    const bConnected = new Date(b.lastEventTime).getTime() > Date.now() - 24 * 60 * 60 * 1000;
    
    if (aConnected !== bConnected) {
      return aConnected ? -1 : 1;
    }
    
    return new Date(b.lastEventTime).getTime() - new Date(a.lastEventTime).getTime();
  });

  return (
    <>
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Connected BLE Devices</h3>
          <p className="text-sm text-gray-500 mt-1">
            {devices.filter(d => 
              new Date(d.lastEventTime).getTime() > Date.now() - 24 * 60 * 60 * 1000
            ).length} of {devices.length} devices connected
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedDevices.map((device, index) => {
            const isConnected = new Date(device.lastEventTime).getTime() > Date.now() - 24 * 60 * 60 * 1000;
            const batteryInfo = getBatteryInfo(device);

            return (
              <div
                key={index}
                className="p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                onClick={() => setSelectedDevice(device)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{device.nodeName}</span>
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Battery className={`w-4 h-4 ${
                        batteryInfo.status === 'Low' ? 'text-orange-500' :
                        batteryInfo.level !== null ?
                          (batteryInfo.level <= 20 ? 'text-orange-500' :
                           batteryInfo.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]')
                        : 'text-[#87B812]'
                      }`} />
                      <span>
                        {batteryInfo.status === 'Low' ? 'Low' :
                         batteryInfo.level !== null ? `${batteryInfo.level}%` :
                         batteryInfo.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatRelativeTime(device.lastEventTime)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            );
          })}
        </div>
      </div>

      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </>
  );
}