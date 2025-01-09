import React from 'react';
import { Wifi, WifiOff, Battery, Tag, Clock } from 'lucide-react';

interface BLEAsset {
  name: string;
  type: string;
  connected: boolean;
  connectionDate: string;
  leashedTime: string;
  lastUpdate: string;
  battery: number;
}

interface Asset {
  name: string;
  bleAssets: BLEAsset[];
}

interface BLEAssetsListProps {
  assets: Asset[];
}

export function BLEAssetsList({ assets }: BLEAssetsListProps) {
  const allBLEAssets = assets.flatMap(asset => 
    asset.bleAssets.map(bleAsset => ({
      ...bleAsset,
      parentAsset: asset.name
    }))
  );

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Digital Leashed BLE Assets</h2>
      <div className="grid gap-4">
        {allBLEAssets.map((asset, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {asset.connected ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="font-semibold">{asset.name}</span>
              </div>
              <span className="text-sm text-gray-500">Parent: {asset.parentAsset}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span>{asset.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Leashed: {asset.leashedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Battery className={`w-4 h-4 ${asset.battery > 50 ? 'text-green-500' : 'text-orange-500'}`} />
                <span>{asset.battery}%</span>
              </div>
              <div className="text-gray-600">
                Connection: {asset.connectionDate}
              </div>
              <div className="text-gray-600">
                Last Update: {asset.lastUpdate}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}