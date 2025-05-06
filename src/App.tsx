import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AssetTrackersPage } from './pages/AssetTrackersPage';
import { SensorsPage } from './pages/SensorsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AlertsPage } from './pages/AlertsPage';
import { LocationHistoryPage } from './pages/LocationHistoryPage';
import { LoginScreen } from './components/LoginScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { fetchTags, Tag, getTagType, getBatteryInfo } from './lib/api';
import { LatLngTuple } from 'leaflet';
import type { ProcessedMarker } from './types/assets';
import { isAuthenticated } from './lib/auth';
import { runningInGeotab } from './lib/geotab';

const DEFAULT_POSITION: LatLngTuple = [36.1428, -78.8846];
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

  const loadTags = useCallback(async (isBackground: boolean = false) => {
    if (!selectedSiteId) return;
    
    try {
      if (!isBackground) {
        setLoading(true);
      } else {
        setIsBackgroundLoading(true);
      }
      
      const data = await fetchTags(selectedSiteId);
      setTags(data);
      setError(null);
    } catch (err) {
      setError('Failed to load assets');
      console.error(err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      } else {
        setIsBackgroundLoading(false);
      }
    }
  }, [selectedSiteId]);

  useEffect(() => {
    if (authenticated && selectedSiteId) {
      loadTags();
      const intervalId = setInterval(() => loadTags(true), REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [authenticated, selectedSiteId, loadTags]);

  const findSuperTagName = (supertagId: string | null) => {
    if (!supertagId) return null;
    const superTag = tags.find(tag => tag.nodeAddress === supertagId);
    return superTag?.nodeName || null;
  };

  const findLeashedTags = (nodeAddress: string) => {
    return tags.filter(tag => tag.sourceSupertagId === nodeAddress);
  };

  const processedMarkers = useMemo(() => {
    return tags.map(tag => {
      const temperature = tag.fahrenheit !== null && tag.fahrenheit !== undefined 
        ? Number(tag.fahrenheit) 
        : null;

      return {
        position: tag.latitude != null && tag.longitude != null
          ? [Number(tag.latitude), Number(tag.longitude)] as LatLngTuple
          : DEFAULT_POSITION,
        name: tag.nodeName || 'Unnamed Asset',
        type: getTagType(tag.registrationToken),
        temperature,
        battery: getBatteryInfo(tag),
        lastUpdate: tag.lastEventTime || new Date().toISOString(),
        bleAssets: findLeashedTags(tag.nodeAddress),
        macAddress: tag.macAddress,
        alerts: tag.alerts,
        doorSensorStatus: tag.doorSensorAlarmStatus,
        leashedToSuperTag: findSuperTagName(tag.sourceSupertagId),
        nodeAddress: tag.nodeAddress,
        registrationToken: tag.registrationToken,
        chargeState: tag.chargeState,
        batteryCapacity_mAh: tag.batteryCapacity_mAh,
        geotabSerialNumber: tag.geotabSerialNumber
      };
    });
  }, [tags]);

  // Filter assets based on searchTerm
  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return processedMarkers;

    const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
    
    return processedMarkers.filter(asset => {
      // Check name
      if (asset.name.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }
      
      // Check MAC address
      if (asset.macAddress.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }
      
      // Check asset type
      if (asset.type.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }
      
      // Check Geotab serial number if available
      if (asset.geotabSerialNumber && asset.geotabSerialNumber.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }
      
      // Check leashed SuperTag name
      if (asset.leashedToSuperTag && asset.leashedToSuperTag.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }

      // Check door sensor status
      if (asset.doorSensorStatus && asset.doorSensorStatus.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }
      
      return false;
    });
  }, [processedMarkers, searchTerm]);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  if (!authenticated) {
    if (runningInGeotab()) {
      return <LoadingScreen onLogin={handleLogin} />;
    } else {
      return <LoginScreen onLogin={handleLogin} />;
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <AssetTrackersPage
              assets={filteredAssets}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
            />
          } 
        />
        <Route 
          path="/sensors" 
          element={
            <SensorsPage
              assets={filteredAssets}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
            />
          } 
        />
        <Route 
          path="/alerts" 
          element={
            <AlertsPage
              assets={filteredAssets}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
            />
          } 
        />
        <Route 
          path="/settings" 
          element={
            <SettingsPage
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
            />
          } 
        />
        <Route 
          path="/location-history/:nodeAddress" 
          element={
            <LocationHistoryPage
              assets={filteredAssets}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;