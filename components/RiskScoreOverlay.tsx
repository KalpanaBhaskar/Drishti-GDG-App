
import React from 'react';
import { X, ShieldAlert, Activity, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface RiskScoreOverlayProps {
  score: number;
  factors: {
    name: string;
    value: string | number;
    impact: string;
    contribution?: string;
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
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl my-auto max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold">Drishti Meta-Risk Assessment</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1">
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
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 text-center">NEW IMPROVED FORMULA</p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">1. Base Density Score:</span>
                <code className="text-blue-400 font-mono">density &gt; 75 ? 75 + (excess × 2) : density</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">2. Incident Penalty:</span>
                <code className="text-blue-400 font-mono">incidents × 15</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">3. Bottleneck Penalty:</span>
                <code className="text-blue-400 font-mono">bottlenecks × 10</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">4. Readiness Modifier:</span>
                <code className="text-blue-400 font-mono">Optimal: -10 | Moderate: 0 | Low: +10</code>
              </div>
              <div className="border-t border-slate-800 pt-2 mt-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-400">Final Score:</span>
                  <code className="text-emerald-400 font-mono">min(100, sum of all)</code>
                </div>
              </div>
              <div className="text-center mt-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-red-400 font-bold">⚠ EDGE CASE: Incidents &gt; 5 → Score = 100 (CODE RED)</span>
              </div>
            </div>
          </div>

          {/* Parameters List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factors.map((factor, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start gap-4">
                <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                  {factor.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{factor.name}</p>
                    {factor.contribution && (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                        {factor.contribution}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-200 mt-1">{factor.value}</p>
                  <p className={`text-[10px] font-medium mt-1 ${
                    factor.impact.includes('Critical') || factor.impact.includes('CODE RED') || factor.impact.includes('High') 
                      ? 'text-red-400' 
                      : factor.impact.includes('Well Prepared') || factor.impact.includes('Clear')
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                  }`}>
                    {factor.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
            <Info size={16} className="text-blue-500 shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              * Risk score calculated using improved 4-parameter formula with density &gt;75% critical threshold, comprehensive incident tracking, bottleneck penalties, and preparedness modifiers. Updates in real-time from video AI analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskScoreOverlay;
