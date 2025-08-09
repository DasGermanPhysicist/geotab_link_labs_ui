import { LatLngTuple } from "leaflet";

export interface ProcessedMarker {
  name: string;
  type: string;
  battery: {
    status: 'OK' | 'Low';
    level: number | null;
  };
  temperature: number | null;
  lastUpdate: string;
  position: LatLngTuple;
  bleAssets: ProcessedMarker[];
  alerts?: string[];
  doorSensorStatus?: string;
  leashedToSuperTag?: string | null;
  macAddress: string;
  geotabSerialNumber?: string;
  registrationToken: string;
  nodeAddress: string;
  chargeState?: 'not_charging' | 'charge_done' | 'charging' | null;
  batteryCapacity_mAh?: number | string;
  // SuperTag Configuration Properties (correct API property names)
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
  stModeHeartbeatInterval?: string | number;
}