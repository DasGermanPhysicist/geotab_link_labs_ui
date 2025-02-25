import axios from 'axios';
import { getAuthHeader } from './auth';
import { securityHeaders } from './security';

const NETWORK_ASSET_API_URL = import.meta.env.VITE_NETWORK_ASSET_API_URL;


export interface Organization {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
}

export interface Tag {
  name: string;
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
}

export interface BatteryInfo {
  status: 'OK' | 'Low';
  level: number | null;
}

export interface BLEAsset {
  name: string;
  type: string;
  connected: boolean;
  connectionDate: string;
  leashedTime: string;
  lastUpdate: string;
  battery: BatteryInfo;
}

export const TagTypes = {
  SUPERTAG: 'D29B3BE8F2CC9A1A7051',
  DOOR_SENSOR: '61697266696E64657200',
  TEMPERATURE: '150285A4E29B7856C7CC'
} as const;

export function getTagType(registrationToken: string): string {
  switch (registrationToken) {
    case TagTypes.SUPERTAG:
      return 'SuperTag';
    case TagTypes.DOOR_SENSOR:
      return 'Door Sensor';
    case TagTypes.TEMPERATURE:
      return 'Temperature Tag';
    default:
      return 'BLE Tag';
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
    const organizations = (response.data || []).map((org: any) => ({
      id: String(org.id || ''),
      name: String(org.value || org.name || 'Unnamed Organization')
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
    return (response.data || []).map((site: any) => ({
      id: String(site.id || ''),
      name: String(site.value || site.name || site.siteName || 'Unnamed Site')
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
    return (response.data || []).map((site: any) => ({
      id: String(site.id || ''),
      name: String(site.value || site.name || site.siteName || 'Unnamed Site')
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
    return (response.data || []).map((tag: any) => ({
      ...tag,
      geotabSerialNumber: tag.geotabSerialNumber || tag.geotabSerial || null
    }));
  } catch (error) {
    console.error('Failed to fetch tags:', {
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