
import React from 'react';
import { X, ShieldAlert, Activity, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface RiskScoreOverlayProps {
  score: number;
  factors: {
    name: string;
    value: string | number;
    impact: string;
    icon: React.ReactNode;
  }[];
  onClose: () => void;
}

const RiskScoreOverlay: React.FC<RiskScoreOverlayProps> = ({ score, factors, onClose }) => {
  const getStatus = (s: number) => {
    if (s >= 75) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (s >= 50) return { label: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    if (s >= 30) return { label: 'MODERATE', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    return { label: 'LOW', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  };

  const status = getStatus(score);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold">Drishti Meta-Risk Assessment</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Main Score Display */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center mb-4 ${status.border} relative`}>
              <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin-slow ${status.color}`} style={{ borderTopColor: 'currentColor' }}></div>
              <span className="text-4xl font-black">{Math.round(score)}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
            </div>
            <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${status.bg} ${status.color} border ${status.border}`}>
              Current Status: {status.label}
            </div>
          </div>

          {/* Formula Section */}
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Computational Logic</p>
            <code className="text-xs text-blue-400 font-mono">
              Risk = (Avg. Density × 0.4) + (Incidents × 12) + (Bottleneck Predictions × 15)
            </code>
          </div>

          {/* Parameters List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factors.map((factor, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start gap-4">
                <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                  {factor.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{factor.name}</p>
                  <p className="text-sm font-bold text-slate-200">{factor.value}</p>
                  <p className={`text-[10px] font-medium mt-1 ${factor.impact.includes('Critical') || factor.impact.includes('High') ? 'text-red-400' : 'text-slate-500'}`}>
                    Impact: {factor.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
            <Info size={16} className="text-blue-500 shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              * The Meta-Score is calculated in real-time by fusing multimodal telemetry from drone feeds, fixed CCTV units, and field personnel reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskScoreOverlay;
