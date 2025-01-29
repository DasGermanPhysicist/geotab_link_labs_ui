import axios from 'axios';

const API_BASE_URL = 'https://networkasset-conductor.link-labs.com';

interface LoginCredentials {
  username: string;
  password: string;
}

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
  batteryStatus?: string | null;
  alerts?: string[];
}

export interface BLEAsset {
  name: string;
  type: string;
  connected: boolean;
  connectionDate: string;
  leashedTime: string;
  lastUpdate: string;
  battery: number;
}

export const TagTypes = {
  SUPERTAG: 'D29B3BE8F2CC9A1A7051',
  DOOR_SENSOR: '61697266696E64657200',
  TEMPERATURE: '150285A4E29B7856C7CC'
} as const;

export function getTagType(registrationToken: string) {
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

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export async function login({ username, password }: LoginCredentials): Promise<boolean> {
  try {
    const authHeader = 'Basic ' + btoa(`${username}:${password}`);
    
    // Test credentials by trying to fetch organizations
    const response = await api.get('/networkAsset/airfinder/organizations', {
      headers: {
        'Authorization': authHeader
      }
    });

    if (response.status === 200) {
      localStorage.setItem('authToken', authHeader);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

export async function fetchOrganizations(): Promise<Organization[]> {
  try {
    const response = await api.get('/networkAsset/airfinder/organizations');
    console.log('Raw organizations response:', response.data); // Debug log
    return response.data.map((org: any) => ({
      id: org.id || '',
      name: org.value || org.name || 'Unnamed Organization' // Use value field first, then fall back to name
    }));
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
}

export async function fetchSites(organizationId: string): Promise<Site[]> {
  try {
    const response = await api.get(`/networkAsset/airfinder/organization/${organizationId}/sites`);
    console.log('Raw sites response:', response.data); // Debug log
    return response.data.map((site: any) => ({
      id: site.id || '',
      name: site.value || site.name || site.siteName || 'Unnamed Site' // Try all possible name fields
    }));
  } catch (error) {
    console.error('Failed to fetch sites:', error);
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
      all: 'true'
    });

    const response = await api.get(`/networkAsset/airfinder/v4/tags?${params}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    throw error;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

export function logout(): void {
  localStorage.removeItem('authToken');
}

export function calculateBatteryPercentage(tag: Tag): number {
  if (!tag.batteryVoltage || !tag.batteryStatus) return 0;
  
  const voltage = parseFloat(tag.batteryVoltage);
  // Basic battery percentage calculation - can be refined based on actual battery specs
  const minVoltage = 2.5;
  const maxVoltage = 4.2;
  const percentage = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
  return Math.round(Math.max(0, Math.min(100, percentage)));
}