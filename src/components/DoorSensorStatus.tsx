import React from 'react';
import { DoorOpen } from 'lucide-react';
import { TagRegistrationToken } from '../lib/api';

interface DoorSensorStatusProps {
  assets: Array<{
    registrationToken: string;
    doorSensorStatus?: string | null;
  }>;
}

export function DoorSensorStatus({ assets }: DoorSensorStatusProps) {
  const doorSensors = assets.filter(asset => 
    asset.registrationToken === TagRegistrationToken.DOOR_SENSOR
  );

  const statusCounts = doorSensors.reduce((acc, sensor) => {
    const status = sensor.doorSensorStatus?.toUpperCase() || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { OPEN: 0, CLOSED: 0, UNKNOWN: 0 } as Record<string, number>);

  return (
    <div className="bg-white rounded-lg shadow-sm px-4 py-3">
      <div className="flex items-center gap-3 mb-4">
        <DoorOpen className="w-6 h-6 text-[#004780]" />
        <h3 className="font-semibold text-lg">Door Sensor Status</h3>
        <div className="text-sm text-gray-500 ml-auto">
          Total Door Sensors: {doorSensors.length}
        </div>
      </div>

      <div className="ll-grid grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Open</span>
            <span className="text-2xl font-bold text-red-500">{statusCounts.OPEN}</span>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Closed</span>
            <span className="text-2xl font-bold text-green-500">{statusCounts.CLOSED}</span>
          </div>
        </div>
      </div>

      {statusCounts.UNKNOWN > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Unknown status: {statusCounts.UNKNOWN} sensors
        </div>
      )}
    </div>
  );
}