import React, { useEffect, useState } from 'react';
import { Organization, Site, fetchOrganizations, fetchSites, fetchCurrentUserSites } from '../lib/api';
import { Building2, MapPin, Search } from 'lucide-react';

interface OrgSiteSelectorProps {
  onSiteSelect: (siteId: string) => void;
}

export function OrgSiteSelector({ onSiteSelect }: OrgSiteSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [hasOrgAccess, setHasOrgAccess] = useState<boolean | null>(true);

  useEffect(() => {
    initLoad();
  }, []);
  
  useEffect(() => {
    if (selectedSiteId) {
      sessionStorage.setItem('selectedSiteId', selectedSiteId);
      onSiteSelect(selectedSiteId);
    }
  }, [selectedSiteId, onSiteSelect]);

  useEffect(() => {
    if (selectedOrgId) {
      getSites(selectedOrgId);
    }
  }, [selectedOrgId]);

  const initLoad = async () => {
    await getOrgs();
  };

  const getOrgs = async () => {
    try {
      setLoading(true);
      const orgs = await fetchOrganizations();

      if (orgs.length === 0) {
        setHasOrgAccess(false);
        const userSites = await fetchCurrentUserSites();
        setSites(userSites);
        setSelectedSiteId(userSites[0]?.id || '');
        setOrganizations([]);
      } else {
        setHasOrgAccess(true);
        const sortedOrgs = orgs.slice().sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        );
        setOrganizations(sortedOrgs);
        if (sessionStorage.getItem('selectedOrgId')) {
          setSelectedOrgId(sessionStorage.getItem('selectedOrgId') ?? '');
        } else {
          setSelectedOrgId(sortedOrgs[0].id);
          sessionStorage.setItem('selectedOrgId', sortedOrgs[0].id);
        }
      }
      setError(null);
    } catch (err) {
      setError('Failed to get organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSites = async (orgId: string) => {
    try {
      setLoading(true);
      const sites = await fetchSites(orgId);
      const sortedSites = sites.slice().sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );
      setSites(sortedSites);
      if (sortedSites[0].organizationId === sessionStorage.getItem('selectedOrgId') &&
          sessionStorage.getItem('selectedSiteId')) {
          setSelectedSiteId(sessionStorage.getItem('selectedSiteId') ?? '');
      } else {
        sessionStorage.setItem('selectedSiteId', sortedSites[0].id);
        setSelectedSiteId(sortedSites[0].id);
      }
      sessionStorage.setItem('selectedOrgId', selectedOrgId);
      setError(null);
    } catch (err) {
      setError('Failed to get sites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    (org.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    setShowOrgDropdown(false);
    setSearchTerm('');
  };

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  if (loading && !organizations.length && !sites.length) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex items-center gap-4">
      {hasOrgAccess && (
        <div className="relative flex-1">
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg bg-white hover:border-[#87B812] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">
                  {selectedOrg ? selectedOrg.name : 'Select Organization'}
                </span>
              </div>
            </button>

            {showOrgDropdown && (
              <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87B812]"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredOrganizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSelect(org.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        selectedOrgId === org.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      {org.name || 'Unnamed Organization'}
                    </button>
                  ))}
                  {filteredOrganizations.length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      No organizations found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`relative ${hasOrgAccess ? 'flex-1' : 'w-full'}`}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          disabled={hasOrgAccess && !selectedOrgId}
          className={`pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#87B812] appearance-none bg-white
            ${hasOrgAccess && !selectedOrgId ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">Select Site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name || 'Unnamed Site'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}