import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Thermometer, Wifi, WifiOff, MapPin, Battery, Clock, X, ChevronRight, DoorOpen, AlertTriangle } from 'lucide-react';
import { Map } from './Map';
import { ProcessedMarker } from '../types/assets';
import { TagRegistrationToken } from '../lib/api';
import { formatRelativeTime, formatLocalDateTime, getDaysSinceTimestamp } from '../lib/dateUtils';
import { getTemperatureDisplay } from '../lib/temperature';

interface SensorListProps {
  sensors: ProcessedMarker[];
  allAssets: ProcessedMarker[];
}

interface SensorDetailModalProps {
  sensor: ProcessedMarker;
  superTag: ProcessedMarker | null;
  onClose: () => void;
}

function SensorDetailModal({ sensor, superTag, onClose }: SensorDetailModalProps) {
  const connected = isConnected(sensor);
  const daysSinceLastConnection = getDaysSinceTimestamp(sensor.lastUpdate);
  const hasOpenDoorAlert = sensor.doorSensorStatus === 'OPEN';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{sensor.name}</h3>
            {hasOpenDoorAlert && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {/* Map */}
          <div className="h-[200px] rounded-lg border border-gray-200 overflow-hidden mb-4">
            <Map
              center={sensor.position}
              zoom={15}
              markers={[sensor]}
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {connected ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                MAC: {sensor.macAddress}
              </div>
              {!connected && (
                <div className="mt-2 text-sm text-red-600">
                  {daysSinceLastConnection} days since last connection
                </div>
              )}
            </div>

            {/* Battery Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Battery className={`w-5 h-5 ${
                  sensor.battery.status === 'Low' ? 'text-orange-500' :
                  sensor.battery.level !== null ?
                    (sensor.battery.level <= 20 ? 'text-orange-500' :
                     sensor.battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]')
                  : 'text-[#87B812]'
                }`} />
                <span className="font-medium">Battery Status</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {sensor.battery.status === 'Low' ? 'Low' :
                 sensor.battery.level !== null ? `${sensor.battery.level}%` :
                 sensor.battery.status}
              </div>
            </div>

            {sensor.registrationToken === TagRegistrationToken.DOOR_SENSOR && (
              <div className={`bg-gray-50 p-4 rounded-lg ${hasOpenDoorAlert ? 'bg-red-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <DoorOpen className={`w-5 h-5 ${
                    sensor.doorSensorStatus === 'OPEN' ? 'text-red-500' : 'text-green-500'
                  }`} />
                  <span className="font-medium">Door Status</span>
                </div>
                <div className={`text-2xl font-bold mt-1 ${
                  sensor.doorSensorStatus === 'OPEN' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {sensor.doorSensorStatus || 'Unknown'}
                </div>
              </div>
            )}

            {sensor.temperature !== null && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Thermometer className={`w-5 h-5 ${
                    sensor.temperature >= 80 ? 'text-red-500' :
                    sensor.temperature >= 70 ? 'text-orange-500' : 
                    'text-[#004780]'
                  }`} />
                  <span className="font-medium">Temperature</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {getTemperatureDisplay(sensor.temperature)}
                </div>
              </div>
            )}

            {superTag && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="font-medium text-blue-700 mb-1">
                  Connected to SuperTag
                </div>
                <div className="text-blue-600">
                  {superTag.name}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Last Update</span>
              </div>
              <div className="text-gray-600">
                {formatLocalDateTime(sensor.lastUpdate)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ({formatRelativeTime(sensor.lastUpdate)})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isConnected(sensor: ProcessedMarker) {
  const lastEventTime = new Date(sensor.lastUpdate).getTime();
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  return lastEventTime >= twentyFourHoursAgo;
}

export function SensorList({ sensors, allAssets }: SensorListProps) {
  const [expandedSensor, setExpandedSensor] = useState<string | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<ProcessedMarker | null>(null);

  // Sort sensors by most recent first
  const sortedSensors = [...sensors].sort((a, b) => {
    const dateA = new Date(a.lastUpdate).getTime();
    const dateB = new Date(b.lastUpdate).getTime();
    return dateB - dateA; // Most recent first
  });

  const toggleSensor = (sensor: ProcessedMarker) => {
    if (window.innerWidth <= 768) {
      setSelectedSensor(sensor);
    } else {
      setExpandedSensor(expandedSensor === sensor.macAddress ? null : sensor.macAddress);
    }
  };

  const findSuperTag = (sensor: ProcessedMarker) => {
    if (!sensor.leashedToSuperTag) return null;
    return allAssets.find(asset => 
      asset.name === sensor.leashedToSuperTag && 
      asset.registrationToken === TagRegistrationToken.SUPERTAG
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
      {sortedSensors.map(sensor => {
        const connected = isConnected(sensor);
        const superTag = findSuperTag(sensor);
        const daysSinceLastConnection = getDaysSinceTimestamp(sensor.lastUpdate);
        const isDoorSensor = sensor.registrationToken === TagRegistrationToken.DOOR_SENSOR;
        const hasOpenDoorAlert = sensor.doorSensorStatus === 'OPEN';

        return (
          <div 
            key={sensor.macAddress}
            className={`bg-white rounded-lg shadow-sm border transition-colors ${
              hasOpenDoorAlert 
                ? 'border-l-4 border-l-red-500 border-t border-r border-b border-gray-200' 
                : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => toggleSensor(sensor)}
              className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {connected ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">{sensor.name}</span>
                  {hasOpenDoorAlert && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Battery Status */}
                <div className="flex items-center gap-1">
                  <Battery className={`w-4 h-4 ${
                    sensor.battery.status === 'Low' ? 'text-orange-500' :
                    sensor.battery.level !== null ?
                      (sensor.battery.level <= 20 ? 'text-orange-500' :
                       sensor.battery.level <= 50 ? 'text-yellow-500' : 'text-[#87B812]')
                    : 'text-[#87B812]'
                  }`} />
                  <span className="text-sm">
                    {sensor.battery.status === 'Low' ? 'Low' :
                     sensor.battery.level !== null ? `${sensor.battery.level}%` :
                     sensor.battery.status}
                  </span>
                </div>

                {isDoorSensor && (
                  <div className="flex items-center gap-1">
                    <DoorOpen className={`w-4 h-4 ${
                      sensor.doorSensorStatus === 'OPEN' ? 'text-red-500' : 'text-green-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      sensor.doorSensorStatus === 'OPEN' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {sensor.doorSensorStatus || 'Unknown'}
                    </span>
                  </div>
                )}
                {sensor.temperature !== null && (
                  <div className="flex items-center gap-1">
                    <Thermometer className={`w-4 h-4 ${
                      sensor.temperature >= 80 ? 'text-red-500' :
                      sensor.temperature >= 70 ? 'text-orange-500' : 
                      'text-[#004780]'
                    }`} />
                    <span className="text-sm">
                      {getTemperatureDisplay(sensor.temperature)}
                    </span>
                  </div>
                )}
                {!connected && (
                  <div className="hidden md:block text-sm text-red-600">
                    {daysSinceLastConnection} days since last connection
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {superTag && (
                  <div className="hidden md:block text-sm text-[#87B812]">
                    Connected to {superTag.name}
                  </div>
                )}
                <div className="md:hidden">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="hidden md:block">
                  {expandedSensor === sensor.macAddress ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Desktop expanded view */}
            {expandedSensor === sensor.macAddress && (
              <div className="hidden md:block border-t border-gray-200">
                <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      Location: {sensor.position[0].toFixed(6)}°N, {sensor.position[1].toFixed(6)}°W
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">MAC ID:</span> {sensor.macAddress}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last Update: {formatRelativeTime(sensor.lastUpdate)}
                    {!connected && (
                      <span className="ml-2 text-red-600">
                        ({daysSinceLastConnection} days since last connection)
                      </span>
                    )}
                  </div>
                  <div className="h-[300px] rounded-lg border border-gray-200 overflow-hidden">
                    <Map
                      center={sensor.position}
                      zoom={15}
                      markers={[sensor]}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {sensors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No sensors found</div>
        </div>
      )}

      {/* Mobile detail modal */}
      {selectedSensor && (
        <SensorDetailModal
          sensor={selectedSensor}
          superTag={findSuperTag(selectedSensor)}
          onClose={() => setSelectedSensor(null)}
        />
      )}
    </div>
  );
}