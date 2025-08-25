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
import { isAuthenticated } from './lib/auth';
import { runningInGeotab } from './lib/geotab';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';

const DEFAULT_POSITION: LatLngTuple = [39.8283459, -98.5820546];
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [tags, setTags] = useState<Tag[]>([]);
  const [geotabInfo, setGeotabInfo] = useState<Tag[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load tag data
  const loadTags = useCallback(async () => {
    if (!selectedSiteId) return;
    
    try {
      // Two seperate NA API calls because of issue NEX-8897; revert after issue is fixed
      // Get tag info minus Geotab Info
      const tagData = await fetchTags(selectedSiteId);

      // Get tag info including Geotab Info
      const geotabTagData = await fetchTags(selectedSiteId, true);
      setTags(tagData);
      setGeotabInfo(geotabTagData);
    } catch (err) {
      console.error(err);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    if (authenticated && selectedSiteId) {
      loadTags();
      const intervalId = setInterval(() => loadTags(), REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [authenticated, selectedSiteId, loadTags]);

  const processedMarkers = useMemo(() => {
    const findSuperTagName = (supertagId: string | null) => {
      if (!supertagId) return null;
      const superTag = tags.find(tag => tag.nodeAddress === supertagId);
      return superTag?.nodeName || null;
    };

    const findLeashedTags = (nodeAddress: string) => {
      return tags.filter(tag => tag.sourceSupertagId === nodeAddress);
    };

    // Find a tag's corresponding geotab info
    const findGeotabTag = (nodeAddress: string) => {
      const geotabTag = geotabInfo.find(tag => tag.nodeAddress === nodeAddress);
      return geotabTag ?? undefined;
    };

    return tags.map(tag => {
      const temperature = tag.fahrenheit !== null && tag.fahrenheit !== undefined 
        ? Number(tag.fahrenheit) 
        : null;

      return {
        position: tag.latitude != null && tag.longitude != null
          ? [Number(tag.latitude), Number(tag.longitude)] as LatLngTuple
          : DEFAULT_POSITION,
        name: tag.nodeName || 'Unnamed Asset',
        type: getTagType(tag.registrationToken, findGeotabTag(tag.nodeAddress)?.geotabSerialNumber, tag.hwId, tag.filterId, tag.msgType),
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
        geotabSerialNumber: findGeotabTag(tag.nodeAddress)?.geotabSerialNumber,
        hwId: tag.hwId,
        filterId: tag.filterId,
        msgType: tag.msgType
      };
    });
  }, [tags, geotabInfo]);

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
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <Header
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showMapView={false}
            onViewChange={() => {}}
            selectedSiteId={selectedSiteId}
            onSiteSelect={setSelectedSiteId}
            showSearchInHeader={false}
          />
          <Navigation />
        </div>
          <Routes>
            <Route 
              path="/" 
              element={
                <AssetTrackersPage
                  assets={filteredAssets}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              } 
            />
            <Route 
              path="/sensors" 
              element={
                <SensorsPage
                  assets={filteredAssets}
                  searchTerm={searchTerm}
                />
              } 
            />
            <Route 
              path="/alerts" 
              element={
                <AlertsPage assets={filteredAssets}/>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <SettingsPage/>
              } 
            />
            <Route 
              path="/location-history/:nodeAddress" 
              element={
                <LocationHistoryPage assets={filteredAssets}/>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
