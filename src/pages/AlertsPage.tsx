import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { ProcessedMarker } from '../types/assets';
import { Bell, ChevronDown, ChevronUp, Thermometer, Battery, Clock } from 'lucide-react';
import { formatRelativeTime, formatLocalDateTime } from '../lib/dateUtils';

interface AlertsPageProps {
  assets: ProcessedMarker[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedSiteId: string;
  onSiteSelect: (siteId: string) => void;
}

interface Alert {
  id: string;
  assetName: string;
  timestamp: string;
  type: 'temperature-high' | 'temperature-low' | 'battery';
  value: number;
  threshold: number;
}

const ALERT_WINDOW_HOURS = 168; // 7 days in hours

export function AlertsPage({
  assets,
  searchTerm,
  onSearchChange,
  selectedSiteId,
  onSiteSelect
}: AlertsPageProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const newAlerts: Alert[] = [];
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (ALERT_WINDOW_HOURS * 60 * 60 * 1000));
    
    // Temperature Alerts
    const temperatureAlertsEnabled = localStorage.getItem('temperatureAlertsEnabled') === 'true';
    if (temperatureAlertsEnabled) {
      const storedThresholds = localStorage.getItem('temperatureThresholds');
      if (storedThresholds) {
        const thresholds = JSON.parse(storedThresholds);
        const useCelsius = localStorage.getItem('temperatureUnit') === 'celsius';

        assets.forEach(asset => {
          const assetTime = new Date(asset.lastUpdate);
          if (assetTime < cutoffTime) return; // Skip if older than 7 days
          if (asset.temperature === null) return;

          const temp = useCelsius 
            ? (asset.temperature - 32) * 5/9 
            : asset.temperature;

          if (temp < thresholds.min) {
            newAlerts.push({
              id: `${asset.macAddress}-temp-low-${Date.now()}`,
              assetName: asset.name,
              timestamp: asset.lastUpdate,
              type: 'temperature-low',
              value: temp,
              threshold: thresholds.min
            });
          }
          
          if (temp > thresholds.max) {
            newAlerts.push({
              id: `${asset.macAddress}-temp-high-${Date.now()}`,
              assetName: asset.name,
              timestamp: asset.lastUpdate,
              type: 'temperature-high',
              value: temp,
              threshold: thresholds.max
            });
          }
        });
      }
    }

    // Battery Alerts
    const batteryAlertsEnabled = localStorage.getItem('batteryAlertsEnabled') === 'true';
    if (batteryAlertsEnabled) {
      const batteryThreshold = parseInt(localStorage.getItem('batteryThreshold') || '20');
      
      assets.forEach(asset => {
        const assetTime = new Date(asset.lastUpdate);
        if (assetTime < cutoffTime) return; // Skip if older than 7 days
        if (asset.battery.level !== null && asset.battery.level <= batteryThreshold) {
          newAlerts.push({
            id: `${asset.macAddress}-battery-${Date.now()}`,
            assetName: asset.name,
            timestamp: asset.lastUpdate,
            type: 'battery',
            value: asset.battery.level,
            threshold: batteryThreshold
          });
        }
      });
    }

    // Sort alerts by timestamp, newest first
    newAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setAlerts(newAlerts);
  }, [assets]);

  const toggleAlert = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'temperature-high':
      case 'temperature-low':
        return <Thermometer className={`w-5 h-5 ${
          type === 'temperature-high' ? 'text-red-500' : 'text-blue-500'
        }`} />;
      case 'battery':
        return <Battery className="w-5 h-5 text-orange-500" />;
    }
  };

  const getAlertTitle = (alert: Alert) => {
    const unit = localStorage.getItem('temperatureUnit') === 'celsius' ? '°C' : '°F';
    switch (alert.type) {
      case 'temperature-high':
        return `High Temperature Alert (${alert.value.toFixed(1)}${unit})`;
      case 'temperature-low':
        return `Low Temperature Alert (${alert.value.toFixed(1)}${unit})`;
      case 'battery':
        return `Low Battery Alert (${alert.value}%)`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <Header
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          showMapView={false}
          onViewChange={() => {}}
          selectedSiteId={selectedSiteId}
          onSiteSelect={onSiteSelect}
          showSearchInHeader={false}
        />
        <Navigation />
      </div>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-[#87B812]" />
                <h1 className="text-xl font-semibold">Alerts</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Showing alerts from the last 7 days</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4">
                <button
                  onClick={() => toggleAlert(alert.id)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {getAlertTitle(alert)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {alert.assetName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      {formatRelativeTime(alert.timestamp)}
                    </div>
                    {expandedAlerts.has(alert.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedAlerts.has(alert.id) && (
                  <div className="mt-4 pl-10">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-500">Asset</div>
                          <div className="text-gray-900">{alert.assetName}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Time</div>
                          <div className="text-gray-900">{formatLocalDateTime(alert.timestamp)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">
                            {alert.type === 'battery' ? 'Battery Level' : 'Temperature'}
                          </div>
                          <div className={`text-gray-900 ${
                            alert.type === 'temperature-high' ? 'text-red-600' :
                            alert.type === 'temperature-low' ? 'text-blue-600' :
                            'text-orange-600'
                          }`}>
                            {alert.value}{alert.type === 'battery' ? '%' : 
                              `°${localStorage.getItem('temperatureUnit') === 'celsius' ? 'C' : 'F'}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Threshold</div>
                          <div className="text-gray-900">
                            {alert.threshold}{alert.type === 'battery' ? '%' : 
                              `°${localStorage.getItem('temperatureUnit') === 'celsius' ? 'C' : 'F'}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No alerts to display
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}