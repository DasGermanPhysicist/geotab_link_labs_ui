import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { Thermometer, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingsPageProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedSiteId: string;
  onSiteSelect: (siteId: string) => void;
}

interface TemperatureThresholds {
  min: number;
  max: number;
}

const DEFAULT_THRESHOLDS = {
  fahrenheit: { min: 32, max: 90 },
  celsius: { min: 0, max: 32 }
};

export function SettingsPage({
  searchTerm,
  onSearchChange,
  selectedSiteId,
  onSiteSelect
}: SettingsPageProps) {
  const navigate = useNavigate();
  const [useCelsius, setUseCelsius] = useState(() => {
    const stored = localStorage.getItem('temperatureUnit');
    return stored === 'celsius';
  });

  const [thresholds, setThresholds] = useState<TemperatureThresholds>(() => {
    const stored = localStorage.getItem('temperatureThresholds');
    if (stored) {
      return JSON.parse(stored);
    }
    return useCelsius ? DEFAULT_THRESHOLDS.celsius : DEFAULT_THRESHOLDS.fahrenheit;
  });

  const [temperatureAlertsEnabled, setTemperatureAlertsEnabled] = useState(() => {
    const stored = localStorage.getItem('temperatureAlertsEnabled');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('temperatureUnit', useCelsius ? 'celsius' : 'fahrenheit');
  }, [useCelsius]);

  useEffect(() => {
    localStorage.setItem('temperatureThresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    localStorage.setItem('temperatureAlertsEnabled', temperatureAlertsEnabled.toString());
  }, [temperatureAlertsEnabled]);

  const handleUnitChange = (newUseCelsius: boolean) => {
    setUseCelsius(newUseCelsius);
    if (newUseCelsius) {
      setThresholds({
        min: Math.round(((thresholds.min - 32) * 5) / 9),
        max: Math.round(((thresholds.max - 32) * 5) / 9)
      });
    } else {
      setThresholds({
        min: Math.round((thresholds.min * 9) / 5 + 32),
        max: Math.round((thresholds.max * 9) / 5 + 32)
      });
    }
  };

  const handleThresholdChange = (type: 'min' | 'max', value: number) => {
    setThresholds(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const getTemperatureRange = () => {
    return useCelsius
      ? { min: -20, max: 50, step: 1 }  // Celsius range
      : { min: -4, max: 122, step: 1 };  // Fahrenheit range
  };

  const range = getTemperatureRange();

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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to Asset Trackers"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          </div>

          <div className="p-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Display Preferences</h2>
              
              <div className="space-y-6">
                {/* Temperature Unit Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Thermometer className="w-5 h-5 text-[#004780]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Temperature Unit</div>
                      <div className="text-sm text-gray-500">
                        Choose how temperature values are displayed
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCelsius}
                      onChange={(e) => handleUnitChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#87B812]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#87B812]"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {useCelsius ? 'Celsius' : 'Fahrenheit'}
                    </span>
                  </label>
                </div>

                {/* Temperature Alerts Toggle */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Bell className="w-5 h-5 text-[#004780]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Temperature Alerts</div>
                      <div className="text-sm text-gray-500">
                        Enable alerts for temperature threshold violations
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temperatureAlertsEnabled}
                      onChange={(e) => setTemperatureAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#87B812]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#87B812]"></div>
                  </label>
                </div>

                {/* Temperature Thresholds */}
                <div className={`space-y-4 transition-opacity ${temperatureAlertsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <h3 className="text-lg font-medium text-gray-900">Temperature Thresholds</h3>
                  
                  {/* Minimum Temperature */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Minimum Temperature
                      </label>
                      <span className="text-sm text-gray-500">
                        {thresholds.min}°{useCelsius ? 'C' : 'F'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      value={thresholds.min}
                      onChange={(e) => handleThresholdChange('min', Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#87B812]"
                      disabled={!temperatureAlertsEnabled}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{range.min}°</span>
                      <span className="text-xs text-gray-500">{range.max}°</span>
                    </div>
                  </div>

                  {/* Maximum Temperature */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Maximum Temperature
                      </label>
                      <span className="text-sm text-gray-500">
                        {thresholds.max}°{useCelsius ? 'C' : 'F'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      value={thresholds.max}
                      onChange={(e) => handleThresholdChange('max', Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#87B812]"
                      disabled={!temperatureAlertsEnabled}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{range.min}°</span>
                      <span className="text-xs text-gray-500">{range.max}°</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Your display preferences and alert settings are automatically saved and will persist across sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}