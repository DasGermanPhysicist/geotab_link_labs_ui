import React from 'react';
import { Map, List, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 hidden md:block">
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="flex space-x-8">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
              isActive('/') 
                ? 'border-[#87B812] text-[#87B812]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Map className="w-5 h-5" />
            Asset Trackers
          </Link>
          <Link
            to="/sensors"
            className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
              isActive('/sensors')
                ? 'border-[#87B812] text-[#87B812]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <List className="w-5 h-5" />
            Sensor List
          </Link>
          <Link
            to="/alerts"
            className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
              isActive('/alerts')
                ? 'border-[#87B812] text-[#87B812]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="w-5 h-5" />
            Alerts
          </Link>
        </div>
      </div>
    </nav>
  );
}