
import React from 'react';
import { AlertTriangle, User, Info } from 'lucide-react';
import { Zone, Incident } from '../types';

interface EventMapProps {
  zones: Zone[];
  incidents: Incident[];
  hasVideoSource?: boolean;
}

const EventMap: React.FC<EventMapProps> = ({ zones, incidents, hasVideoSource = false }) => {
  const getZoneColor = (density: number) => {
    if (density >= 80) return 'fill-red-500/80 stroke-red-600';
    if (density >= 60) return 'fill-orange-500/80 stroke-orange-600';
    if (density >= 40) return 'fill-yellow-500/80 stroke-yellow-600';
    return 'fill-emerald-500/80 stroke-emerald-600';
  };

  const getAlertIcon = (zoneId: string) => {
    // CRITICAL: Red alert only shows when density STRICTLY > 75% (not >= 75%)
    const hasCritical = zones.find(z => z.id === zoneId && z.density > 75);
    const hasIncident = incidents.find(i => i.location === zoneId && i.status !== 'resolved');
    
    // Red alert icon only for critical density (> 75%), not for incidents
    if (hasCritical) {
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
             <div className="absolute -inset-2 bg-red-500/50 blur-md rounded-full animate-ping"></div>
             <div className="relative bg-red-600 text-white p-1 rounded-full shadow-lg border border-red-400">
                <AlertTriangle size={16} />
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Show blank state if no video source - but show basic map structure
  if (!hasVideoSource && zones.length === 0) {
    return (
      <div className="relative w-full h-full min-h-[500px] bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Info size={40} className="text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">Waiting for Event Data</h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            The tactical map will display zone information once the event begins and AI analysis data is available.
          </p>
          <p className="text-xs text-slate-600 mt-4 italic">
            Check the AI Summary tab for current event status
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-8">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Schematic Map Layout - 6 Fixed Zones (2x3 grid) */}
      <div className="relative w-full max-w-3xl grid grid-cols-3 grid-rows-2 gap-4">
        {zones.map((zone) => {
          let gridArea = "";
          switch(zone.id) {
            case 'zone-a': gridArea = "col-start-1 row-start-1"; break;
            case 'zone-b': gridArea = "col-start-2 row-start-1"; break;
            case 'zone-c': gridArea = "col-start-3 row-start-1"; break;
            case 'zone-d': gridArea = "col-start-1 row-start-2"; break;
            case 'zone-e': gridArea = "col-start-2 row-start-2"; break;
            case 'zone-f': gridArea = "col-start-3 row-start-2"; break;
          }

          return (
            <div 
              key={zone.id} 
              className={`${gridArea} relative group transition-all duration-500`}
            >
              <div className={`w-full h-full rounded-md border-2 ${getZoneColor(zone.density)} transition-colors duration-700 relative flex flex-col items-center justify-center p-4`}>
                <span className="text-[10px] font-bold uppercase text-slate-200/50 mb-1">{zone.name}</span>
                <span className="text-xl font-black text-white">{zone.density.toFixed(3)}%</span>
                
                {getAlertIcon(zone.id)}
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute invisible group-hover:visible z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-2xl pointer-events-none">
                <p className="text-xs font-bold text-white mb-2">{zone.name} Analytics</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Current Flow</span>
                    <span className="text-emerald-400">Stable</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Predicted (20m)</span>
                    <span className={zone.predictedDensity > 80 ? 'text-red-400' : 'text-slate-200'}>{zone.predictedDensity.toFixed(3)}%</span>
                  </div>
                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${zone.density}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 p-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg">
        <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">Crowd Density</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
            <span className="text-xs text-slate-300">Critical (80%+)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
            <span className="text-xs text-slate-300">High (60-79%)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
            <span className="text-xs text-slate-300">Moderate (40-59%)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-xs text-slate-300">Low (&lt;40%)</span>
          </div>
        </div>
      </div>

      {/* Map Layers Control */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-xl">
           <div className="flex items-center gap-2 mb-3 px-1">
             <Info size={14} className="text-slate-500" />
             <span className="text-xs font-bold text-slate-400">Map Layers</span>
           </div>
           <div className="space-y-2">
             <label className="flex items-center gap-3 cursor-pointer">
               <input type="checkbox" defaultChecked className="w-3 h-3 accent-blue-600 rounded" />
               <span className="text-[11px] text-slate-300">Crowd Density</span>
             </label>
             <label className="flex items-center gap-3 cursor-pointer">
               <input type="checkbox" defaultChecked className="w-3 h-3 accent-blue-600 rounded" />
               <span className="text-[11px] text-slate-300">Predicted Bottlenecks</span>
             </label>
             <label className="flex items-center gap-3 cursor-pointer">
               <input type="checkbox" defaultChecked className="w-3 h-3 accent-blue-600 rounded" />
               <span className="text-[11px] text-slate-300">Active Incidents</span>
             </label>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EventMap;
