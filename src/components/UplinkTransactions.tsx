import React from 'react';
import { MapPin, Battery, Thermometer, Box } from 'lucide-react';

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
    bleAssets: Math.round(1 + Math.random() * 3)
  }));

  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((tx) => (
        <div key={tx.id} className="p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium">{tx.assetName}</span>
            <span className="text-sm text-gray-500">{tx.timestamp}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{tx.position[0].toFixed(4)}°N, {tx.position[1].toFixed(4)}°W</span>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-[#87B812]" />
              <span>{tx.battery}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#004780]" />
              <span>{tx.temperature}°F</span>
            </div>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-gray-500" />
              <span>{tx.bleAssets} BLE Assets</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}