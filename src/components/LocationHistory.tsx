import React, { useState, useEffect, useCallback } from 'react';
import { subDays } from 'date-fns';
import { History, Calendar, Loader2, ArrowLeft, Clock } from 'lucide-react';
import { fetchLocationHistory, LocationHistoryEntry } from '../lib/api';
import LocationHistoryMap from './LocationHistoryMap';
import LocationHistoryTimeline from './LocationHistoryTimeline';
import { formatDateForInput, convertToUTC, formatLocalDateTime } from '../lib/dateUtils';

interface LocationHistoryProps {
  nodeAddress: string;
  assetName: string;
  onBack: () => void;
}

const LocationHistory: React.FC<LocationHistoryProps> = ({ 
  nodeAddress, 
  assetName,
  onBack
}) => {
  // Initialize date range with UTC ISO strings
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date(subDays(new Date(), 7).setHours(0, 0, 0, 0)).toISOString();
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString();
  });
  
  const [historyData, setHistoryData] = useState<LocationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationHistoryEntry | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Function to load history data
  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchLocationHistory(nodeAddress, startDate, endDate);
      setHistoryData(data);
    } catch (err) {
      setError('Failed to load location history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [nodeAddress, startDate, endDate]);
  
  // Load data on component mount and when date range changes
  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);
  
  // Handle date range change (last 24h, 7d, 30d)
  const handleDateRangeChange = (days: number) => {
    setStartDate(new Date(subDays(new Date(), days).setHours(0, 0, 0, 0)).toISOString());
    setEndDate(new Date().toISOString());
    setShowCustomDatePicker(false);
  };
  
  // Handle custom date range submission
  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const customStartDate = formData.get('start-date') as string;
    const customEndDate = formData.get('end-date') as string;
    
    if (customStartDate && customEndDate) {
      // Convert local time inputs to UTC for the API
      setStartDate(convertToUTC(customStartDate));
      setEndDate(convertToUTC(customEndDate));
    }
  };
  
  // Handle timeline entry selection
  const handleSelectLocation = (entry: LocationHistoryEntry) => {
    setSelectedLocation(entry);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-[#87B812]" />
              Location History
            </h2>
            <div className="text-sm text-gray-500 mt-1">
              {assetName} ({nodeAddress})
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleDateRangeChange(1)}
            className={`px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors ${
              !showCustomDatePicker && startDate === new Date(subDays(new Date(), 1).setHours(0, 0, 0, 0)).toISOString()
                ? 'bg-[#87B812] text-white hover:bg-[#759e0f]'
                : 'border border-gray-200'
            }`}
          >
            Last 24h
          </button>
          <button
            onClick={() => handleDateRangeChange(7)}
            className={`px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors ${
              !showCustomDatePicker && startDate === new Date(subDays(new Date(), 7).setHours(0, 0, 0, 0)).toISOString()
                ? 'bg-[#87B812] text-white hover:bg-[#759e0f]'
                : 'border border-gray-200'
            }`}
          >
            Last 7d
          </button>
          <button
            onClick={() => handleDateRangeChange(30)}
            className={`px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors ${
              !showCustomDatePicker && startDate === new Date(subDays(new Date(), 30).setHours(0, 0, 0, 0)).toISOString()
                ? 'bg-[#87B812] text-white hover:bg-[#759e0f]'
                : 'border border-gray-200'
            }`}
          >
            Last 30d
          </button>
          <button
            onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
            className={`px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors ${
              showCustomDatePicker
                ? 'bg-[#87B812] text-white hover:bg-[#759e0f]'
                : 'border border-gray-200'
            }`}
            title="Custom Date Range"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom date picker */}
      {showCustomDatePicker && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleCustomDateSubmit} className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="start-date"
                name="start-date"
                defaultValue={formatDateForInput(startDate)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                required
                step="60" // Allow minute selection (60 seconds)
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="end-date"
                name="end-date"
                defaultValue={formatDateForInput(endDate)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                required
                step="60" // Allow minute selection (60 seconds)
              />
            </div>
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#87B812] text-white rounded-lg hover:bg-[#759e0f] transition-colors"
              >
                Apply Range
              </button>
            </div>
          </form>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Selected range: {formatLocalDateTime(startDate)} to {formatLocalDateTime(endDate)}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#87B812] animate-spin mb-4" />
          <p className="text-gray-500">Loading location history...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map View */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Map View</h3>
                </div>
                <div className="h-[500px]">
                  <LocationHistoryMap 
                    historyData={historyData} 
                    selectedLocation={selectedLocation}
                  />
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="font-medium text-sm mb-3">Location Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">GPS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">WiFi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm">Cell ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-sm">WiFi + Cell ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">SuperTag (loc0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm">Heartbeat</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span>Latest location</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <span>First location in time range</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timeline View */}
            <div className="lg:col-span-1">
              <LocationHistoryTimeline 
                historyData={historyData}
                onSelectLocation={handleSelectLocation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationHistory;