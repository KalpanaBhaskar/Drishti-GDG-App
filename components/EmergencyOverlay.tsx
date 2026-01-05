
import React, { useState, useEffect } from 'react';
import { Siren, X, Navigation, Phone, ShieldAlert, HeartPulse, Loader2, ExternalLink } from 'lucide-react';
import { getEmergencyResources } from '../services/geminiService';

interface EmergencyOverlayProps {
  onClose: () => void;
  emergencyConfig: {
    locationName: string;
    contactPhone: string;
    latitude: number;
    longitude: number;
  };
  sosMapLinks?: {
    policeStation: string;
    hospital: string;
    fireStation: string;
  };
}

const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({ onClose, emergencyConfig, sosMapLinks }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ text: string, sources: any[] }>({ text: '', sources: [] });

  useEffect(() => {
    console.log('🚨 SOS Emergency Overlay mounted');
    console.log('Emergency Config:', emergencyConfig);
    
    // Use admin-configured coordinates
    const fetchResources = async () => {
      try {
        const result = await getEmergencyResources(
          emergencyConfig?.latitude || 19.0760, 
          emergencyConfig?.longitude || 72.8777
        );
        setData(result);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching emergency resources:', error);
        // Set default data on error
        setData({ 
          text: 'Unable to fetch nearby resources. Please use the emergency contact above.', 
          sources: [] 
        });
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [emergencyConfig]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto" style={{ isolation: 'isolate' }}>
      <button 
        onClick={onClose}
        className="fixed top-8 right-8 p-4 rounded-full bg-red-900 border-2 border-red-600 text-white hover:bg-red-800 hover:border-red-400 transition-all z-[10000] shadow-lg shadow-red-900/50"
        title="Close Emergency Panel"
      >
        <X size={28} strokeWidth={3} />
      </button>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center my-8">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-red-600 rounded-2xl shadow-2xl shadow-red-900/40 animate-pulse">
                <Siren size={32} className="text-white" />
             </div>
             <div>
                <h1 className="text-4xl font-black tracking-tighter text-white">TACTICAL SOS</h1>
                <p className="text-red-500 font-bold uppercase tracking-widest text-sm">Emergency Protocol Active</p>
             </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
             <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert size={20} className="text-blue-500" />
                Emergency Contact
             </h3>
             <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-4 mb-4">
               <div className="flex items-center gap-3 mb-2">
                 <Phone className="text-blue-400" size={18} />
                 <span className="text-xs font-bold text-blue-400 uppercase">Event Control Center</span>
               </div>
               <a 
                 href={`tel:${emergencyConfig.contactPhone}`}
                 className="text-2xl font-black text-white hover:text-blue-400 transition-colors"
               >
                 {emergencyConfig.contactPhone || '+91-XXXX-XXXXXX'}
               </a>
               <p className="text-xs text-slate-400 mt-2">
                 📍 {emergencyConfig.locationName || 'Event Location'}
               </p>
             </div>
             
             <h3 className="text-sm font-bold flex items-center gap-2 pt-2">
                <ShieldAlert size={16} className="text-emerald-500" />
                Nearby Resources
             </h3>
             {loading ? (
               <div className="flex items-center gap-3 text-slate-400 py-4">
                  <Loader2 className="animate-spin" size={18} />
                  <p className="text-sm">Calculating fastest routes to nearest units...</p>
               </div>
             ) : (
               <div className="space-y-4">
                 <p className="text-xs text-slate-400 leading-relaxed">{data.text}</p>
                 <div className="grid grid-cols-2 gap-3 pt-2">
                    <a 
                      href="tel:100"
                      className="flex flex-col items-center justify-center p-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-red-950/20 hover:border-red-900/50 transition-all group"
                    >
                       <Phone className="text-slate-500 group-hover:text-red-500 mb-2" size={18} />
                       <span className="text-[9px] font-bold uppercase">Police (100)</span>
                    </a>
                    <a 
                      href="tel:108"
                      className="flex flex-col items-center justify-center p-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-emerald-950/20 hover:border-emerald-900/50 transition-all group"
                    >
                       <HeartPulse className="text-slate-500 group-hover:text-emerald-500 mb-2" size={18} />
                       <span className="text-[9px] font-bold uppercase">Medical (108)</span>
                    </a>
                 </div>
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4">
              <p className="text-[10px] font-bold text-blue-500 mb-1">UNIT ALPHA-1</p>
              <p className="text-lg font-black text-white">3.2m ETA</p>
              <p className="text-[10px] text-slate-500 mt-1">Route Optimized: Gateway Dr.</p>
            </div>
            <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-xl p-4">
              <p className="text-[10px] font-bold text-emerald-500 mb-1">MEDIC TEAM 4</p>
              <p className="text-lg font-black text-white">4.8m ETA</p>
              <p className="text-[10px] text-slate-500 mt-1">Status: Dispatched</p>
            </div>
          </div>
        </div>

        <div className="relative aspect-square bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/72.8777,19.0760,13/800x800?access_token=pk.xxx')] bg-cover"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
             <div className="w-full space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Emergency Resources (Admin Configured)</h4>
                
                {/* Admin-configured SOS Map Links */}
                {sosMapLinks && (
                  <>
                    <a 
                      href={sosMapLinks.policeStation} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg hover:border-blue-500 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-bold text-slate-200">🚔 Police Station</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-600 group-hover:text-blue-500" />
                    </a>
                    
                    <a 
                      href={sosMapLinks.hospital} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg hover:border-emerald-500 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-bold text-slate-200">🏥 Hospital / Medical Center</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-600 group-hover:text-emerald-500" />
                    </a>
                    
                    <a 
                      href={sosMapLinks.fireStation} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg hover:border-orange-500 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-xs font-bold text-slate-200">🚒 Fire Station</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-600 group-hover:text-orange-500" />
                    </a>
                  </>
                )}
                
                {/* AI-fetched resources (if available) */}
                {data.sources.map((chunk, idx) => (
                  <a 
                    key={idx} 
                    href={chunk.maps?.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg hover:border-blue-500 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs font-bold text-slate-200">{chunk.maps?.title || 'Unknown Station'}</span>
                    </div>
                    <ExternalLink size={14} className="text-slate-600 group-hover:text-blue-500" />
                  </a>
                ))}
             </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-full shadow-2xl">
             <Navigation size={14} className="text-blue-500 animate-pulse" />
             <span className="text-[10px] font-bold text-slate-400">Tactical Map Feed: LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyOverlay;
