import React from 'react';
import { MapPin, Battery, Thermometer, Box, AlertTriangle } from 'lucide-react';

interface UplinkTransactionsProps {
  timeRange: '24h' | '7d' | '30d' | '60d';
}

export function UplinkTransactions({ timeRange }: UplinkTransactionsProps) {
  // Sample data - replace with real data
  const transactions = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    assetName: `Asset Tracker #${(i % 3) + 1}`,
    position: [40.7128 + (Math.random() * 0.01), -74.0060 + (Math.random() * 0.01)],
    timestamp: new Date(Date.now() - (i * 1000 * 60 * 30)).toLocaleString(), // Every 30 minutes
    temperature: Math.round(68 + Math.random() * 10),
    battery: Math.round(85 - (i * 2)),
    bleAssets: Math.round(1 + Math.random() * 3),
    hasAlert: Math.random() > 0.7,
    alertType: ['temperature', 'battery', 'impact'][Math.floor(Math.random() * 3)]
  }));

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'temperature':
        return 'text-red-500';
      case 'battery':
        return 'text-orange-500';
      case 'impact':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getAlertTitle = (alertType: string) => {
    switch (alertType) {
      case 'temperature':
        return 'High Temperature Alert';
      case 'battery':
        return 'Low Battery Alert';
      case 'impact':
        return 'Impact Alert';
      default:
        return 'Alert';
    }
  };

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div 
          key={tx.id} 
          className={`bg-white rounded-lg border transition-all duration-200 hover:border-[#87B812] group
            ${tx.hasAlert ? 'border-l-4 border-l-red-500 border-t border-r border-b border-gray-200' : 'border-gray-200'}`}
        >
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 group-hover:text-[#004780] transition-colors">
                  {tx.assetName}
                </span>
                {tx.hasAlert && (
                  <div className="relative group/tooltip">
                    <AlertTriangle 
                      className={`w-4 h-4 ${getAlertColor(tx.alertType)}`}
                    />
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 transform -translate-y-full 
                                  opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200
                                  whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs z-10">
                      {getAlertTitle(tx.alertType)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>{tx.timestamp}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-1.5">
                <Battery 
                  className={`w-4 h-4 ${
                    tx.battery <= 20 ? 'text-orange-500' : 
                    tx.battery <= 50 ? 'text-yellow-500' : 'text-[#87B812]'
                  }`} 
                />
                <span className={`text-sm ${
                  tx.battery <= 20 ? 'text-orange-600' : 
                  tx.battery <= 50 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {tx.battery}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Thermometer 
                  className={`w-4 h-4 ${
                    tx.temperature >= 80 ? 'text-red-500' :
                    tx.temperature >= 70 ? 'text-orange-500' : 'text-[#004780]'
                  }`} 
                />
                <span className="text-sm text-gray-600">{tx.temperature}°F</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Box className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{tx.bleAssets} BLE</span>
              </div>
            </div>

            {/* Location */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{tx.position[0].toFixed(4)}°N, {tx.position[1].toFixed(4)}°W</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}