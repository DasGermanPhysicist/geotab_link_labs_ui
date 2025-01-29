import React, { useEffect, useState } from 'react';
import { Organization, Site, fetchOrganizations, fetchSites } from '../lib/api';
import { Building2, MapPin, Search } from 'lucide-react';

interface OrgSiteSelectorProps {
  onSiteSelect: (siteId: string) => void;
}

export function OrgSiteSelector({ onSiteSelect }: OrgSiteSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadSites(selectedOrgId);
    } else {
      setSites([]);
      setSelectedSiteId('');
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (selectedSiteId) {
      onSiteSelect(selectedSiteId);
    }
  }, [selectedSiteId, onSiteSelect]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await fetchOrganizations();
      // Sort organizations alphabetically by name
      const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setOrganizations(sortedData);
      setError(null);
    } catch (err) {
      setError('Failed to load organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async (orgId: string) => {
    try {
      setLoading(true);
      const data = await fetchSites(orgId);
      // Sort sites alphabetically by name
      const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setSites(sortedData);
      setError(null);
    } catch (err) {
      setError('Failed to load sites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !organizations.length) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Building2 className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#87B812] appearance-none bg-white"
        />
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Building2 className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#87B812] appearance-none bg-white"
        >
          <option value="" className="text-gray-900">Select Organization</option>
          {filteredOrganizations.map((org) => (
            <option key={org.id} value={org.id} className="text-gray-900 bg-white">
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          disabled={!selectedOrgId}
          className={`pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#87B812] appearance-none bg-white
            ${!selectedOrgId ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="" className="text-gray-900">Select Site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id} className="text-gray-900 bg-white">
              {site.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}