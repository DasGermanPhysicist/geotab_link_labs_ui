import React, { useState } from 'react';
import { Search, HelpCircle, X, LogOut } from 'lucide-react';
import { OrgSiteSelector } from './OrgSiteSelector';
import { logout } from '../lib/auth';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showMapView: boolean;
  onViewChange: (showMap: boolean) => void;
  selectedSiteId: string;
  onSiteSelect: (siteId: string) => void;
  showSearchInHeader?: boolean;
}

export function Header({
  searchTerm,
  onSearchChange,
  showMapView,
  onViewChange,
  selectedSiteId,
  onSiteSelect,
  showSearchInHeader = true
}: HeaderProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-[60]">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-[1800px] mx-auto gap-4">
          <div className="flex items-center justify-between md:space-x-12">
            <h1 className="text-2xl font-bold text-[#004780]">Link Labs</h1>
            <button
              onClick={() => setShowOrgSelector(!showOrgSelector)}
              className="md:hidden text-gray-600"
            >
              {showOrgSelector ? <X className="w-6 h-6" /> : <Search className="w-6 h-6" />}
            </button>
          </div>

          <div className={`${showOrgSelector ? 'block' : 'hidden'} md:block w-full md:w-auto`}>
            <OrgSiteSelector onSiteSelect={onSiteSelect} />
          </div>

          <div className="flex items-center justify-between md:space-x-8">
            {showSearchInHeader && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => onViewChange(false)}
                  className={`px-4 md:px-6 py-2 text-sm ${!showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onViewChange(true)}
                  className={`px-4 md:px-6 py-2 text-sm ${showMapView ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'}`}
                >
                  Map
                </button>
              </div>
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                title="Help & Support"
              >
                <HelpCircle className="w-5 h-5 text-[#004780]" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors group relative"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[999]">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowHelpModal(false)} />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#004780]">Link Labs Support</h2>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4 text-gray-600">
              <p>
                Need assistance with your Link Labs devices or have questions about the platform?
              </p>
              <p>
                Visit our help center to access documentation, FAQs, and submit support requests to our dedicated team.
              </p>
            </div>

            <div className="mt-8">
              <a
                href="https://apps.airfinder.com/help"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#87B812] text-white text-center px-6 py-3 rounded-lg hover:bg-[#769f10] transition-colors font-medium"
                onClick={() => setShowHelpModal(false)}
              >
                Visit Help Center
              </a>
              <p className="text-sm text-gray-500 text-center mt-4">
                Our support team is available Monday through Friday, 9 AM to 5 PM EST
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}