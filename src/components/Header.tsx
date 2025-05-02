import React, { useState, useRef, useEffect } from 'react';
import { Search, HelpCircle, X, LogOut, User, ChevronDown, Menu, Map, List, Settings, Bell } from 'lucide-react';
import { OrgSiteSelector } from './OrgSiteSelector';
import { logout } from '../lib/auth';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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
  selectedSiteId,
  onSiteSelect,
  showSearchInHeader = true
}: HeaderProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-[60]">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-[1800px] mx-auto gap-4">
          <div className="flex items-center justify-between md:space-x-12">
            <h1 className="text-2xl font-bold text-[#004780]">Link Labs</h1>
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setShowOrgSelector(!showOrgSelector)}
                className="text-gray-600"
              >
                {showOrgSelector ? <X className="w-6 h-6" /> : <Search className="w-6 h-6" />}
              </button>
              <button
                onClick={() => setShowMobileMenu(true)}
                className="text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className={`${showOrgSelector ? 'block' : 'hidden'} md:block w-full md:w-auto`}>
            <OrgSiteSelector onSiteSelect={onSiteSelect} />
          </div>

          <div className="hidden md:flex items-center justify-between md:space-x-8">
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
              {/* Profile Menu - Desktop */}
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-[#87B812] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-[#004780]" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowHelpModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4 text-[#004780]" />
                      Help & Support
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-white z-[70] md:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#004780]">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="px-6 py-8 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#87B812] rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Welcome</div>
                  <div className="text-sm text-gray-500">Link Labs User</div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="space-y-2">
                <Link
                  to="/"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive('/') ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <Map className="w-5 h-5" />
                  Asset Trackers
                </Link>
                <Link
                  to="/sensors"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive('/sensors') ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <List className="w-5 h-5" />
                  Sensor List
                </Link>
                <Link
                  to="/alerts"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive('/alerts') ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  Alerts
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive('/settings') ? 'bg-[#87B812] text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-6 py-4">
              <div className="space-y-2">
                {/* Help & Support */}
                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg"
                >
                  <HelpCircle className="w-5 h-5 text-[#004780]" />
                  <span>Help & Support</span>
                </button>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

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