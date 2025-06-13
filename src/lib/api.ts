import axios from 'axios';
import { getAuthHeader } from './auth';
import { securityHeaders } from './security';

const NETWORK_ASSET_API_URL = import.meta.env.VITE_NETWORK_ASSET_API_URL;


export interface Organization {
  id: string;
  name: string;
  value?: string;
}

export interface Site {
  id: string;
  name: string;
  value?: string;
  siteName?: string;
  assetInfo: {
    metadata: {
      props: {
        organizationId: string;
      };
    };
  };
}

export interface Tag {
  nodeName: string;
  macAddress: string;
  fahrenheit: number | null;
  lastEventTime: string;
  longitude: number | null;
  latitude: number | null;
  registrationToken: string;
  nodeAddress: string;
  sourceSupertagId: string | null;
  batteryVoltage?: string | null;
  doorSensorAlarmStatus?: string | null;
  batteryStatus: number | string;
  batteryCapacity_mAh: number | string;
  batteryConsumed_mAh?: number | string | null;
  batteryUsage_uAh?: number | string | null;
  alerts?: string[];
  geotabSerialNumber?: string;
  geotabSerial?: string;
  chargeState?: 'not_charging' | 'charge_done' | 'charging';
  hwId?: string;
  filterId?: string;
  msgType?: string;
}

export interface BatteryInfo {
  status: 'OK' | 'Low';
  level: number | null;
}

export interface BLEAsset {
  nodeName: string;
  type: string;
  connected: boolean;
  connectionDate: string;
  leashedTime: string;
  lastUpdate: string;
  battery: BatteryInfo;
}

export interface LocationHistoryEntry {
  latitude?: string;
  longitude?: string;
  time: string;
  locationType?: string;
}

export const TagHwId = {
  SUPERTAG_PRO: '00',  
  SUPERTAG_PLUS: '02',  
  SUPERTAG_RECHARGE: '0A'
} as const;

export const TagName = {
  SUPERTAG: 'SuperTag',
  DOOR_SENSOR: 'Door Sensor',
  TEMPERATURE: 'Temperature Tag',
} as const;

export const TagPrefixCode = {
  SUPERTAG_PRO: 'LM',
  SUPERTAG_PLUS: 'LN',
  SUPERTAG_RECHARGE: 'LO',
  DOOR_SENSOR: 'LW',
  TEMPERATURE: 'LV',
} as const;

export const TagFilterId = {
  TEMPERATURE_1: '11',
  TEMPERATURE_2: '12',
  DOOR_SENSOR_1: '38',
  DOOR_SENSOR_2: '39'
} as const;

export const TagRegistrationToken = {
  SUPERTAG: 'D29B3BE8F2CC9A1A7051',
  DOOR_SENSOR: '61697266696E64657200',
  TEMPERATURE: '150285A4E29B7856C7CC',
} as const;

export function getTagType(
  registrationToken: string | undefined,
  geotabSerialNumber: string | undefined,
  hwId: string | undefined,
  filterId: string | undefined,
  msgType: string | undefined): string {
  switch (registrationToken) {
    case TagRegistrationToken.SUPERTAG:
      switch (hwId) {
        case TagHwId.SUPERTAG_PRO:
          return 'SuperTag Pro';
        case TagHwId.SUPERTAG_PLUS:
          return 'SuperTag Plus';
        case TagHwId.SUPERTAG_RECHARGE:
          return 'SuperTag Recharge';
      }
      return 'SuperTag';
    case TagRegistrationToken.DOOR_SENSOR:
      switch (filterId) {
        case TagFilterId.TEMPERATURE_1:
          return 'Temperature Tag';
        case TagFilterId.TEMPERATURE_2:
          return 'Temperature Tag';
        case TagFilterId.DOOR_SENSOR_1:
          return 'Door Sensor';
        case TagFilterId.DOOR_SENSOR_2:
          return 'Door Sensor';
      }
      switch (msgType) {
        case TagFilterId.TEMPERATURE_1:
          return 'Temperature Tag';
        case TagFilterId.TEMPERATURE_2:
          return 'Temperature Tag';
        case TagFilterId.DOOR_SENSOR_1:
          return 'Door Sensor';
        case TagFilterId.DOOR_SENSOR_2:
          return 'Door Sensor';
      }
      return 'Door Sensor';
    case TagRegistrationToken.TEMPERATURE:
      return 'Temperature Tag';
    default:
      switch (geotabSerialNumber?.slice(0, 2)) {
        case TagPrefixCode.SUPERTAG_PRO:
          return 'SuperTag Pro';
        case TagPrefixCode.SUPERTAG_PLUS:
          return 'SuperTag Plus';
        case TagPrefixCode.SUPERTAG_RECHARGE:
          return 'SuperTag Recharge';
        case TagPrefixCode.DOOR_SENSOR:
          return 'Door Sensor';
        case TagPrefixCode.TEMPERATURE:
          return 'Temperature Tag';
        default:
          return 'BLE Tag';
      }
  }
}

const network_asset_api = axios.create({
  baseURL: NETWORK_ASSET_API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...securityHeaders()
  },
});

network_asset_api.interceptors.request.use((config) => {
  const token = getAuthHeader();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export async function fetchOrganizations(): Promise<Organization[]> {
  try {
    const response = await network_asset_api.get('/networkAsset/airfinder/organizations');
    const organizations = (response.data ?? []).map((org: Organization) => ({
      id: String(org.id ?? ''),
      name: String(org.value ?? org.name ?? 'Unnamed Organization')
    }));
    return organizations;
  } catch (error) {
    console.error('Failed to fetch organizations:', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function fetchCurrentUserSites(): Promise<Site[]> {
  try {
    const response = await network_asset_api.get('/networkAsset/airfinder/sites?currentUser=true');
    return (response.data ?? []).map((site: Site) => ({
      id: String(site.id ?? ''),
      name: String(site.value ?? site.name ?? site.siteName ?? 'Unnamed Site'),
      organizationId: site.assetInfo.metadata.props.organizationId,
    }));
  } catch (error) {
    console.error('Failed to fetch current user sites:', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function fetchSites(organizationId: string): Promise<Site[]> {
  try {
    const response = await network_asset_api.get(`/networkAsset/airfinder/organization/${organizationId}/sites`);
    return (response.data ?? []).map((site: Site) => ({
      id: String(site.id ?? ''),
      name: String(site.value ?? site.name ?? site.siteName ?? 'Unnamed Site'),
      organizationId: site.assetInfo.metadata.props.organizationId,
    }));
  } catch (error) {
    console.error('Failed to fetch sites:', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function fetchTags(siteId: string): Promise<Tag[]> {
  try {
    const params = new URLSearchParams({
      siteId,
      format: 'json',
      page: '1',
      sortBy: 'nodeName',
      sort: 'asc',
      all: 'true',
      includeGeotabInfo: 'true'
    });

    const response = await network_asset_api.get(`/networkAsset/airfinder/v4/tags?${params}`);
    return (response.data ?? []).map((tag: Tag) => ({
      ...tag,
      geotabSerialNumber: tag.geotabSerialNumber ?? tag.geotabSerial ?? null
    }));
  } catch (error) {
    console.error('Failed to fetch tags:', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function fetchLocationHistory(
  nodeAddress: string, 
  startDate: string, 
  endDate: string
): Promise<LocationHistoryEntry[]> {
  try {
    const url = `/networkAsset/airfinder/device-location-history/${nodeAddress}/${startDate}/${endDate}?showCellIds=`;
    const response = await network_asset_api.get(url);
    return response.data ?? [];
  } catch (error) {
    console.error('Failed to fetch location history:', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export function getBatteryInfo(tag: Tag): BatteryInfo {
  const batteryStatusNum = Number(tag.batteryStatus);
  
  if (batteryStatusNum === 0 || isNaN(batteryStatusNum)) {
    return { status: 'Low', level: null };
  }

  const status = batteryStatusNum === 1 ? 'OK' : 'Low';
  let level: number | null = null;

  const batteryCapacity = Number(tag.batteryCapacity_mAh);
  
  if (!isNaN(batteryCapacity) && batteryCapacity !== 470 && batteryCapacity !== 470.0) {
    if (tag.batteryConsumed_mAh != null) {
      const consumed = Number(tag.batteryConsumed_mAh);
      if (!isNaN(consumed)) {
        level = ((batteryCapacity * 0.75 - consumed) / (batteryCapacity * 0.75)) * 100;
      }
    } else if (tag.batteryUsage_uAh != null) {
      const usage = Number(tag.batteryUsage_uAh);
      if (!isNaN(usage)) {
        level = ((batteryCapacity * 0.75 - usage / 1000) / (batteryCapacity * 0.75)) * 100;
      }
    }

    if (level !== null) {
      level = Math.max(0, Math.min(100, Math.round(level)));
    }
  }

  return { status, level };
}