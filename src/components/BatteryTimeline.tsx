import { useState } from 'react';
import { Battery } from 'lucide-react';

interface BatteryData {
  timestamp: string;
  batteryLevel: number;
  consumption: number;
}

// Sample data - replace with real data
const generateSampleData = (days: number): BatteryData[] => {
  const data: BatteryData[] = [];
  const now = new Date();
  let batteryLevel = 100;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const consumption = Math.random() * 2 + 1; // Random consumption between 1-3%
    batteryLevel -= consumption;
    
    data.unshift({
      timestamp: date.toISOString(),
      batteryLevel: Math.max(0, Math.round(batteryLevel * 10) / 10),
      consumption: Math.round(consumption * 10) / 10
    });
  }
  
  return data;
};

export function BatteryTimeline() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '60d'>('24h');
  const data = generateSampleData(timeRange === '24h' ? 1 : 
                                timeRange === '7d' ? 7 : 
                                timeRange === '30d' ? 30 : 60);
  
  const remainingBattery = data[data.length - 1].batteryLevel;
  const totalConsumption = 100 - remainingBattery;

  return (
    <div className="bg-gray-100 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Battery Consumption Timeline</h2>
        <div className="flex gap-2">
          {(['24h', '7d', '30d', '60d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded ${
                timeRange === range 
                  ? 'bg-[#87B812] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="ll-grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-6 h-6 text-[#87B812]" />
            <span className="font-semibold">Remaining Battery</span>
          </div>
          <div className="text-3xl font-bold text-[#004780]">{remainingBattery}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-6 h-6 text-orange-500" />
            <span className="font-semibold">Total Consumption</span>
          </div>
          <div className="text-3xl font-bold text-orange-500">{totalConsumption}%</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="h-40 relative">
            {/* Battery level line */}
            <svg className="w-full h-full">
              <path
                d={`M 0 ${100 - data[0].batteryLevel} ` + 
                  data.map((point, i) => 
                    `L ${(i / (data.length - 1)) * 100}% ${100 - point.batteryLevel}`
                  ).join(' ')}
                fill="none"
                stroke="#87B812"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            
            {/* Time markers */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-sm text-gray-500">
              {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((point, i) => (
                <div key={i} className="text-center">
                  {new Date(point.timestamp).toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Battery Level</th>
              <th className="px-4 py-2 text-left">Consumption</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2">{new Date(point.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2">{point.batteryLevel}%</td>
                <td className="px-4 py-2">{point.consumption}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}