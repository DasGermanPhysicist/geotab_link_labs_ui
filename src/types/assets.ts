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
  bleAssets: any[];
  alerts?: string[];
  doorSensorStatus?: string;
  leashedToSuperTag?: string | null;
  macAddress: string;
  geotabSerialNumber?: string;
  registrationToken: string;
  nodeAddress: string;
  chargeState?: 'not_charging' | 'charge_done' | 'charging' | null;
  batteryCapacity_mAh?: number | string;
}