import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LocationHistory from '../components/LocationHistory';
import { ProcessedMarker } from '../types/assets';

interface LocationHistoryPageProps {
  assets: ProcessedMarker[];
}

export function LocationHistoryPage({
  assets
}: LocationHistoryPageProps) {
  const navigate = useNavigate();
  const { nodeAddress } = useParams<{ nodeAddress: string }>();
  
  const asset = assets.find(a => a.nodeAddress === nodeAddress);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <main className="max-w-[1600px] mx-auto p-4 md:p-6">
      {asset && nodeAddress ? (
        <LocationHistory
          nodeAddress={nodeAddress}
          assetName={asset.name}
          onBack={handleBack}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">Asset not found or no node address provided.</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-[#87B812] text-white rounded-lg hover:bg-[#769f10] transition-colors"
          >
            Go Back
          </button>
        </div>
      )}
    </main>
  );
}