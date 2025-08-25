import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Settings, MapPin, Clock, Navigation, HelpCircle } from 'lucide-react';
import { TagRegistrationToken, fetchSuperTagConfig, SuperTagConfig } from '../lib/api';

interface SuperTagConfigurationProps {
  asset: {
    registrationToken: string;
    name: string;
    nodeAddress: string;
  };
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

function Tooltip({ children, content }: TooltipProps) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTooltipPosition = () => {
      if (!tooltipRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Calculate available space
      const spaceLeft = containerRect.left;
      const spaceRight = viewportWidth - containerRect.right;
      
      // Determine optimal width (max 256px, but constrain to available space)
      const maxWidth = Math.min(256, viewportWidth - 32); // 32px total margin
      
      const newTooltipStyle: React.CSSProperties = {
        width: `${maxWidth}px`,
        bottom: '100%',
        marginBottom: '8px'
      };
      
      const newArrowStyle: React.CSSProperties = {
        top: '100%',
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent', 
        borderTop: '4px solid #1f2937'
      };

      // Determine horizontal position
      if (spaceRight < maxWidth / 2 + 8) {
        // Not enough space on right, align to right edge
        newTooltipStyle.right = 0;
        newArrowStyle.right = '16px';
      } else if (spaceLeft < maxWidth / 2 + 8) {
        // Not enough space on left, align to left edge  
        newTooltipStyle.left = 0;
        newArrowStyle.left = '16px';
      } else {
        // Enough space on both sides, center it
        newTooltipStyle.left = '50%';
        newTooltipStyle.transform = 'translateX(-50%)';
        newArrowStyle.left = '50%';
        newArrowStyle.transform = 'translateX(-50%)';
      }
      
      setTooltipStyle(newTooltipStyle);
      setArrowStyle(newArrowStyle);
      setIsPositioned(true); // Mark as positioned and ready to show
    };

    const handleMouseEnter = () => {
      setIsPositioned(false); // Hide while calculating
      updateTooltipPosition();
    };

    const handleMouseLeave = () => {
      setIsPositioned(false); // Reset for next hover
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <div ref={containerRef} className="relative group inline-block">
      {children}
      <div 
        ref={tooltipRef}
        className={`absolute px-4 py-3 bg-gray-800 text-white text-sm rounded-lg transition-opacity duration-200 pointer-events-none z-[99999] shadow-lg ${
          isPositioned ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
        }`}
        style={tooltipStyle}
      >
        <div className="text-left leading-relaxed">{content}</div>
        <div className="absolute z-[99999]" style={arrowStyle}></div>
      </div>
    </div>
  );
}

export function SuperTagConfiguration({ asset }: SuperTagConfigurationProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [config, setConfig] = useState<SuperTagConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch config when component mounts or asset changes
  useEffect(() => {
    // Only fetch config for SuperTags
    if (asset.registrationToken === TagRegistrationToken.SUPERTAG && asset.nodeAddress) {
      const loadConfig = async () => {
        setLoading(true);
        try {
          const configData = await fetchSuperTagConfig(asset.nodeAddress);
          setConfig(configData);
        } catch (error) {
          console.error('Failed to load SuperTag configuration:', error);
        } finally {
          setLoading(false);
        }
      };

      loadConfig();
    }
  }, [asset.nodeAddress, asset.registrationToken]);

  // Only show for SuperTags
  if (asset.registrationToken !== TagRegistrationToken.SUPERTAG) {
    return null;
  }

  // Helper function to format time values
  const formatTimeValue = (value?: string | number, unit: string = 'seconds'): string => {
    if (!value || value === 0 || value === '0') return 'Disabled';
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(numValue) || numValue === 0) return 'Disabled';
    
    if (numValue >= 3600) {
      const hours = Math.floor(numValue / 3600);
      const minutes = Math.floor((numValue % 3600) / 60);
      const seconds = numValue % 60;
      if (minutes === 0 && seconds === 0) return `${hours}h`;
      if (seconds === 0) return `${hours}h ${minutes}m`;
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (numValue >= 60) {
      const minutes = Math.floor(numValue / 60);
      const seconds = numValue % 60;
      if (seconds === 0) return `${minutes}m`;
      return `${minutes}m ${seconds}s`;
    }
    return `${numValue}${unit === 'seconds' ? 's' : unit}`;
  };

  // Parse GPS/WiFi/CellID order based on the three separate order values
  const parseLocationOrder = (): string => {
    if (!config) return 'Loading...';
    
    const gps = Number(config.gpsOrder) || 0;
    const wifi = Number(config.wifiOrder) || 0; 
    const cell = Number(config.cellOrder) || 0;
    
    // Create array of [source, order] pairs, filter out disabled (0), and sort by order
    const sources = [
      ['GPS', gps],
      ['WiFi', wifi], 
      ['CellID', cell]
    ].filter(([, order]) => order > 0)
     .sort((a, b) => a[1] - b[1]);
    
    // Return the ordered list or 'All Disabled' if no sources are enabled
    if (sources.length === 0) {
      return 'All Disabled';
    }
    
    return sources.map(([source]) => source).join(' → ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading SuperTag configuration...</div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <div className="text-gray-500">Unable to load SuperTag configuration</div>
        </div>
      </div>
    );
  }

  // Get the most important configuration values
  const locationUpdateRateMoving = formatTimeValue(config.stModeLocUpdateRate_Moving);
  const locationUpdateRateStationary = formatTimeValue(config.stModeLocUpdateRate_Stationary);
  const heartbeatInterval = formatTimeValue(config.stModeHeartbeatInterval);
  const sendOnStopWaitTime = formatTimeValue(config.sendOnStopWaitTime_s);
  const locationOrder = parseLocationOrder();

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <Settings className="w-5 h-5 text-[#87B812]" />
          SuperTag Configuration
        </h2>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Key Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location Update Rates */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2 group">
                <MapPin className="w-5 h-5 text-[#87B812]" />
                <span className="text-sm font-medium text-gray-600">ST Mode Location Update Intervals</span>
                <Tooltip content="The SuperTag sleeps most of the time to save battery. When it starts moving, it finds its location right away. While moving, it checks location at the moving time. When sitting still, it checks location at the stationary time.">
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </Tooltip>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Moving:</span>
                  <span className="text-lg font-bold text-gray-900">{locationUpdateRateMoving}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stationary:</span>
                  <span className="text-lg font-bold text-gray-900">{locationUpdateRateStationary}</span>
                </div>
              </div>
            </div>

            {/* Heartbeat Interval */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#004780]" />
                <span className="text-sm font-medium text-gray-600">ST Mode Heartbeat Interval</span>
                <Tooltip content="The SuperTag sends a health check message at this time. This message tells us the SuperTag is working but doesn't include location to save battery.">
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {heartbeatInterval}
              </div>
            </div>
          </div>

          {/* Send on Stop Wait Time */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#87B812]" />
              <span className="text-sm font-medium text-gray-600">Send on Stop Wait Time</span>
              <Tooltip content="After moving for this amount of time and then stopping, the SuperTag will try to find its location. This helps us know where the SuperTag ended up.">
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {sendOnStopWaitTime}
            </div>
          </div>
          {/* Location Source Priority */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Location Priority Order
              <Tooltip content="The SuperTag has different ways to find its location. This shows the order it tries each way. It stops when one works. GPS works best in open areas but uses more battery. WiFi works well in cities and saves battery.">
                <HelpCircle className="w-4 h-4 text-blue-600 hover:text-blue-800 cursor-help" />
              </Tooltip>
            </h3>
            <div className="text-lg font-semibold text-blue-800">
              {locationOrder}
            </div>
            <div className="text-sm text-blue-600 mt-2">
              GPS Order: {config.gpsOrder === '0' ? 'Disabled' : config.gpsOrder ?? 'Not set'} | 
              WiFi Order: {config.wifiOrder === '0' ? 'Disabled' : config.wifiOrder ?? 'Not set'} | 
              CellID Order: {config.cellOrder === '0' ? 'Disabled' : config.cellOrder ?? 'Not set'}
            </div>
          </div>

          {/* Configuration Note */}
          <div className="text-xs text-gray-500 italic">
            To modify configurations, visit apps.airfinder.com or contact Link Labs support.
          </div>
        </div>
      )}
    </div>
  );
}