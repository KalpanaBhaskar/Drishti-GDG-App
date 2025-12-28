
import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map, 
  FileText,
  Activity, 
  Menu, 
  Siren, 
  Sparkles, 
  Bell, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  incidentCount: number;
  newAnnouncementsCount?: number;
  onSOSClick: () => void;
  onAgentClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  userRole: UserRole;
  onLogout: () => void;
  riskScore: number;
  onRiskClick: () => void;
  attendeeCount: number;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  incidentCount,
  newAnnouncementsCount = 0,
  onSOSClick, 
  onAgentClick,
  isSidebarCollapsed,
  onToggleSidebar,
  userRole,
  onLogout,
  riskScore,
  onRiskClick,
  attendeeCount
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell size={20} /> },
    { id: 'bottleneck', label: 'Bottleneck Analysis', icon: <Activity size={20} /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={20} />, badge: incidentCount, badgeColor: 'red' },
    { id: 'complaints', label: 'Complaints', icon: <FileText size={20} /> },
  ];

  if (userRole === 'admin') {
    navItems.push({ id: 'config', label: 'Admin Settings', icon: <Settings size={20} /> });
  }

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-500 border-red-900/50 bg-red-950/30';
    if (score >= 50) return 'text-orange-500 border-orange-900/50 bg-orange-950/30';
    if (score >= 30) return 'text-yellow-500 border-yellow-900/50 bg-yellow-950/30';
    return 'text-emerald-500 border-emerald-900/50 bg-emerald-950/30';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 75) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 relative">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-slate-800 flex flex-col z-20 bg-slate-950 transition-all duration-300 ease-in-out`}
      >
        <div className={`p-6 flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="min-w-[32px] w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden">PROJECT DRISHTI</h1>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isSidebarCollapsed ? item.label : ''}
              className={`w-full flex items-center rounded-lg transition-all relative ${
                isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
              } ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              {!isSidebarCollapsed && (
                <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
              )}
              {!isSidebarCollapsed && (item as any).badge && (item as any).badge > 0 && (
                <span className={`ml-auto text-white text-[10px] px-2 py-0.5 rounded-full ${
                  (item as any).badgeColor === 'orange' ? 'bg-orange-600' : 'bg-red-600'
                }`}>
                  {(item as any).badge}
                </span>
              )}
              {isSidebarCollapsed && (item as any).badge && (item as any).badge > 0 && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  (item as any).badgeColor === 'orange' ? 'bg-orange-600' : 'bg-red-600'
                }`}></div>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-900 space-y-2">
          <div className={`flex items-center gap-3 px-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
               <User size={16} className="text-slate-400" />
             </div>
             {!isSidebarCollapsed && (
               <div className="overflow-hidden">
                 <p className="text-xs font-bold truncate capitalize">{userRole}</p>
                 <p className="text-[10px] text-slate-500 truncate">Mumbai 2024</p>
               </div>
             )}
          </div>
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-2 py-2 text-slate-500 hover:text-red-400 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span className="text-xs font-bold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
             <button 
                onClick={onToggleSidebar}
                className="p-2 hover:bg-slate-900 rounded-lg transition-colors text-slate-400 hover:text-white"
             >
                <Menu size={20} />
             </button>
             <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Event</p>
                <h2 className="text-sm font-semibold">Mumbai Music Festival 2024</h2>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onSOSClick}
              className="group relative flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-1.5 rounded-full text-white font-black text-xs transition-all shadow-lg shadow-red-900/20 active:scale-95"
            >
              <div className="absolute -inset-1 bg-red-600/30 blur-md rounded-full group-hover:animate-ping pointer-events-none"></div>
              <Siren size={16} className="relative animate-bounce" />
              <span className="relative hidden sm:inline">SOS EMERGENCY</span>
              <span className="relative sm:hidden">SOS</span>
            </button>

            <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-8">
              <button 
                onClick={onRiskClick}
                className="flex flex-col items-center group transition-all"
              >
                <span className="text-[10px] text-slate-500 uppercase font-bold group-hover:text-blue-400">Risk Level</span>
                <div className={`border px-3 py-0.5 rounded text-xs font-bold mt-1 flex items-center gap-1.5 transition-all group-hover:scale-105 ${getRiskColor(riskScore)}`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current`}></div>
                  {getRiskLabel(riskScore)}
                </div>
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold text-center">Active Alerts</span>
                <span className="text-lg font-bold text-center">{incidentCount}</span>
              </div>
              <div className="flex flex-col max-lg:hidden">
                <span className="text-[10px] text-slate-500 uppercase font-bold text-center">Attendees</span>
                <span className="text-lg font-bold text-center">{attendeeCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {children}
        </main>
      </div>

      {/* Floating AI Agent Button */}
      <button 
        onClick={onAgentClick}
        className="fixed bottom-8 right-24 z-50 w-16 h-16 rounded-full bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-900/40 hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative">
          <Sparkles className="text-white group-hover:rotate-12 transition-transform" size={28} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-slate-950 rounded-full"></div>
        </div>
      </button>
    </div>
  );
};

export default Layout;
