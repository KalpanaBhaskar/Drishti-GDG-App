
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import EventMap from './components/EventMap';
import SituationalSummaryPanel from './components/SituationalSummaryPanel';
import EmergencyOverlay from './components/EmergencyOverlay';
import RiskScoreOverlay from './components/RiskScoreOverlay';
import AuthModal from './components/AuthModal';
import { Zone, Incident, RiskLevel, UserRole, Announcement, EmergencyConfig, Complaint } from './types';
import { signUpAdmin, signInAdmin, signOutAdmin, onAuthStateChange } from './services/authService';
import {
  listenToZones,
  listenToIncidents,
  listenToAnnouncements,
  listenToEventConfig,
  listenToVideoSource,
  listenToComplaints,
  saveZones,
  addIncident,
  addAnnouncement,
  updateIncidentStatus as updateIncidentStatusDb,
  saveEventConfig,
  saveRiskScore,
  saveVideoMetrics,
  saveVideoSource,
  deleteVideoSource,
  addComplaint,
  revokeComplaint,
  addComplaintReply,
  updateComplaintStatus,
  VideoSourceData,
  ComplaintData
} from './services/firestoreService';
import LiveFeedPlayer from './components/LiveFeedPlayer';
import VideoInputManager from './components/VideoInputManager';
import ComplaintLaunch from './components/ComplaintLaunch';
import { 
  Shield, 
  MapPin, 
  Clock, 
  Search, 
  Upload, 
  ChevronRight, 
  Siren, 
  Activity, 
  AlertTriangle, 
  X, 
  Bell, 
  Send, 
  Lock, 
  Map as MapIcon, 
  Phone,
  Plus,
  Edit2,
  CheckCircle,
  Eye,
  Settings,
  TrendingUp,
  Users
} from 'lucide-react';

const INITIAL_ZONES: Zone[] = [
  { id: 'zone-a', name: 'Zone A', density: 45, predictedDensity: 52, status: 'normal' },
  { id: 'zone-b', name: 'Zone B', density: 61, predictedDensity: 75, status: 'congested' },
  { id: 'zone-c', name: 'Zone C', density: 82, predictedDensity: 91, status: 'bottleneck' },
  { id: 'zone-d', name: 'Zone D', density: 38, predictedDensity: 42, status: 'normal' },
  { id: 'zone-e', name: 'Zone E', density: 55, predictedDensity: 60, status: 'normal' },
  { id: 'zone-f', name: 'Zone F', density: 50, predictedDensity: 55, status: 'normal' },
];

const INITIAL_INCIDENTS: Incident[] = [
  { 
    id: 'INC-001', 
    type: 'medical', 
    location: 'zone-b', 
    status: 'dispatched', 
    priority: 'high', 
    timestamp: '14:22', 
    description: 'Male, 24, reporting heat exhaustion in Zone B.' 
  },
  { 
    id: 'INC-002', 
    type: 'security', 
    location: 'zone-c', 
    status: 'reported', 
    priority: 'high', 
    timestamp: '14:35', 
    description: 'Potential crowd surge detected via Vision API in Zone C.' 
  },
  { 
    id: 'INC-003', 
    type: 'anomaly', 
    location: 'zone-a', 
    status: 'resolved', 
    priority: 'medium', 
    timestamp: '13:50', 
    description: 'Suspicious unattended bag reported in Zone A. Cleared by K9 unit.' 
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ANN-001', title: 'Main Stage Update', content: 'Performance delayed by 15 mins due to technical checks.', timestamp: '14:00', priority: 'normal' },
  { id: 'ANN-002', title: 'Hydration Alert', content: 'Free water stations now open in South VIP and East Food Plaza.', timestamp: '13:45', priority: 'normal' },
];

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [attendeeCount, setAttendeeCount] = useState(45280);
  const [emergencyConfig, setEmergencyConfig] = useState<EmergencyConfig>({
    locationName: 'Mumbai Central First Aid Hub',
    contactPhone: '+91-9876543210',
    latitude: 19.0760,
    longitude: 72.8777
  });

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isRiskOverlayOpen, setIsRiskOverlayOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dashboardView, setDashboardView] = useState<'live-feed' | 'tactical-map'>('tactical-map');
  const [videoSource, setVideoSource] = useState<VideoSourceData | null>(null);
  const [lastSeenAnnouncementCount, setLastSeenAnnouncementCount] = useState(0);
  const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);
  
  // Admin forms
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'normal' as 'normal' | 'urgent' });
  const [newIncident, setNewIncident] = useState<Partial<Incident>>({ type: 'medical', location: 'zone-c', priority: 'medium', description: '' });

  // Risk Score Logic
  const riskAssessment = useMemo(() => {
    const avgDensity = zones.reduce((acc, z) => acc + z.density, 0) / zones.length;
    const activeHighIncidents = incidents.filter(i => i.status !== 'resolved' && i.priority === 'high').length;
    const bottleneckPredictions = zones.filter(z => z.predictedDensity >= 75).length;

    // Formula: Risk = (Avg Density * 0.4) + (High Incidents * 12) + (Bottleneck Preds * 15)
    const rawScore = (avgDensity * 0.4) + (activeHighIncidents * 12) + (bottleneckPredictions * 15);
    const finalScore = Math.min(100, rawScore);

    const factors = [
      {
        name: 'Crowd Density',
        value: `${Math.round(avgDensity)}% Avg`,
        impact: avgDensity > 70 ? 'High Severity' : avgDensity > 40 ? 'Moderate' : 'Low',
        icon: <Users size={20} />
      },
      {
        name: 'Critical Incidents',
        value: `${activeHighIncidents} Active`,
        impact: activeHighIncidents > 2 ? 'Critical Dispatch' : activeHighIncidents > 0 ? 'Urgent' : 'Nominal',
        icon: <AlertTriangle size={20} />
      },
      {
        name: 'Bottleneck Forecasts',
        value: `${bottleneckPredictions} Zones`,
        impact: bottleneckPredictions > 1 ? 'High Risk' : 'Monitoring',
        icon: <TrendingUp size={20} />
      },
      {
        name: 'Response Readiness',
        value: 'Optimal',
        impact: 'Nominal Offset',
        icon: <Activity size={20} />
      }
    ];

    return { score: finalScore, factors };
  }, [zones, incidents]);

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (userRole === 'admin') {
          setUserRole(null);
        }
      }
    });

    return () => unsubscribe();
  }, [userRole]);

  // Initialize Firebase listeners for real-time data
  useEffect(() => {
    if (!isInitialized) {
      // Initialize with default data first time - ensure only 6 zones
      console.log('🔧 Initializing Firebase with 6 fixed zones...');
      saveZones(INITIAL_ZONES).then(() => {
        console.log('✅ 6 fixed zones initialized in Firebase');
      }).catch(console.error);
      setIsInitialized(true);
    }

    // Listen to zones in real-time
    const unsubscribeZones = listenToZones((updatedZones) => {
      if (updatedZones.length > 0) {
        // Ensure we only use the 6 fixed zones (A-F)
        const validZones = updatedZones.filter(z => 
          ['zone-a', 'zone-b', 'zone-c', 'zone-d', 'zone-e', 'zone-f'].includes(z.id)
        );
        
        // If we have exactly 6 zones, use them
        if (validZones.length === 6) {
          setZones(validZones);
        } else if (validZones.length > 6) {
          // Take only the first 6 if there are duplicates
          console.warn('⚠️ More than 6 zones detected, using first 6');
          setZones(validZones.slice(0, 6));
        }
      }
    });

    // Listen to incidents in real-time
    const unsubscribeIncidents = listenToIncidents((updatedIncidents) => {
      if (updatedIncidents.length > 0) {
        setIncidents(updatedIncidents);
      }
    });

    // Listen to announcements in real-time
    const unsubscribeAnnouncements = listenToAnnouncements((updatedAnnouncements) => {
      if (updatedAnnouncements.length > 0) {
        // Calculate new announcements for public users
        const newCount = updatedAnnouncements.length - lastSeenAnnouncementCount;
        if (newCount > 0 && userRole === 'public') {
          setNewAnnouncementsCount(newCount);
        }
        setAnnouncements(updatedAnnouncements);
      }
    });

    // Listen to event config in real-time
    const unsubscribeConfig = listenToEventConfig((config) => {
      if (config) {
        setAttendeeCount(config.attendeeCount);
        setEmergencyConfig({
          locationName: config.locationName,
          contactPhone: config.emergencyContactPhone,
          latitude: config.latitude,
          longitude: config.longitude
        });
      }
    });

    // Listen to video source in real-time
    const unsubscribeVideo = listenToVideoSource((video) => {
      setVideoSource(video);
    });

    // Listen to complaints in real-time
    const unsubscribeComplaints = listenToComplaints((updatedComplaints) => {
      setComplaints(updatedComplaints);
    });

    return () => {
      unsubscribeZones();
      unsubscribeIncidents();
      unsubscribeAnnouncements();
      unsubscribeConfig();
      unsubscribeVideo();
      unsubscribeComplaints();
    };
  }, [isInitialized]);

  // Only simulate zones if no video source is active or analysis is not running
  const [isVideoAnalysisActive, setIsVideoAnalysisActive] = useState(false);

  useEffect(() => {
    // Only run simulation if video analysis is not active
    if (isVideoAnalysisActive) {
      return; // Skip simulation when AI is analyzing
    }

    const interval = setInterval(() => {
      setZones(prev => {
        // Ensure we only work with 6 fixed zones
        const validZones = prev.filter(z => 
          ['zone-a', 'zone-b', 'zone-c', 'zone-d', 'zone-e', 'zone-f'].includes(z.id)
        ).slice(0, 6);
        
        const updatedZones = validZones.map(zone => ({
          ...zone,
          density: Math.min(100, Math.max(0, zone.density + (Math.random() * 4 - 2)))
        }));
        
        // Save updated zones to Firebase
        saveZones(updatedZones).catch(console.error);
        
        // Save video metrics for each zone
        updatedZones.forEach(zone => {
          saveVideoMetrics({
            timestamp: new Date().toISOString(),
            totalPeople: Math.floor(zone.density * 100),
            crowdDensity: zone.density,
            avgMovementSpeed: Math.random() * 2,
            anomalyDetections: zone.density > 80 ? Math.floor(Math.random() * 3) : 0,
            zoneId: zone.id
          }).catch(console.error);
        });
        
        return updatedZones;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isVideoAnalysisActive]);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const ann: Announcement = {
      id: `ANN-${Date.now()}`,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: newAnnouncement.priority
    };
    
    try {
      await addAnnouncement(ann);
      setNewAnnouncement({ title: '', content: '', priority: 'normal' });
    } catch (error) {
      console.error('Error adding announcement:', error);
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const inc: Incident = {
      id: `INC-${Date.now()}`,
      type: newIncident.type as any,
      location: newIncident.location as any,
      status: 'reported',
      priority: newIncident.priority as any,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: newIncident.description || '',
    };
    
    try {
      await addIncident(inc);
      setNewIncident({ type: 'medical', location: 'central', priority: 'medium', description: '' });
    } catch (error) {
      console.error('Error adding incident:', error);
    }
  };

  const updateIncidentStatus = async (id: string, status: Incident['status']) => {
    try {
      await updateIncidentStatusDb(id, status);
    } catch (error) {
      console.error('Error updating incident status:', error);
    }
  };

  // Save risk score to Firebase whenever it changes
  useEffect(() => {
    if (riskAssessment.score > 0) {
      const riskLevel = 
        riskAssessment.score >= 80 ? 'CRITICAL' :
        riskAssessment.score >= 60 ? 'HIGH' :
        riskAssessment.score >= 40 ? 'MODERATE' : 'LOW';
      
      saveRiskScore({
        score: riskAssessment.score,
        level: riskLevel,
        factors: riskAssessment.factors,
        timestamp: new Date().toISOString()
      }).catch(console.error);
    }
  }, [riskAssessment.score]);

  // Save event config when it changes
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  
  const handleSaveEventConfig = async () => {
    try {
      await saveEventConfig({
        attendeeCount,
        emergencyContactPhone: emergencyConfig.contactPhone,
        locationName: emergencyConfig.locationName,
        latitude: emergencyConfig.latitude,
        longitude: emergencyConfig.longitude
      });
      
      // Show saved message
      setShowSavedMessage(true);
      
      // Auto-navigate to dashboard after 1.5 seconds
      setTimeout(() => {
        setShowSavedMessage(false);
        setActiveTab('dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error saving event config:', error);
      alert('Failed to save configuration');
    }
  };

  // Authentication handlers
  const handleSignUp = async (email: string, password: string) => {
    await signUpAdmin(email, password);
  };

  const handleSignIn = async (email: string, password: string) => {
    await signInAdmin(email, password);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setUserRole('admin');
  };

  const handleLogout = async () => {
    try {
      await signOutAdmin();
      setUserRole(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Video source handlers
  const handleSaveVideoSource = async (videoData: { type: 'youtube' | 'local'; url: string; fileName?: string }) => {
    try {
      const videoSourceData: VideoSourceData = {
        id: `VIDEO-${Date.now()}`,
        type: videoData.type,
        url: videoData.url,
        fileName: videoData.fileName,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin'
      };
      await saveVideoSource(videoSourceData);
    } catch (error) {
      console.error('Error saving video source:', error);
      throw error;
    }
  };

  const handleDeleteVideoSource = async () => {
    try {
      await deleteVideoSource();
    } catch (error) {
      console.error('Error deleting video source:', error);
      throw error;
    }
  };

  // Complaint handlers
  const handleSubmitComplaint = async (complaintData: {
    subject: string;
    details: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    department: 'security' | 'medical' | 'facilities' | 'crowd-management' | 'general';
  }) => {
    try {
      const complaint: ComplaintData = {
        id: `COMP-${Date.now()}`,
        subject: complaintData.subject,
        details: complaintData.details,
        importance: complaintData.importance,
        department: complaintData.department,
        status: 'open',
        submittedBy: isAuthenticated ? 'admin@drishti.com' : 'public@user.com', // In production, use actual user email
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      await addComplaint(complaint);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      throw error;
    }
  };

  const handleRevokeComplaint = async (complaintId: string) => {
    try {
      await revokeComplaint(complaintId);
    } catch (error) {
      console.error('Error revoking complaint:', error);
    }
  };

  const handleReplyToComplaint = async (complaintId: string, reply: string) => {
    try {
      await addComplaintReply(complaintId, reply, 'admin@drishti.com'); // In production, use actual admin email
    } catch (error) {
      console.error('Error replying to complaint:', error);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, status: 'open' | 'in-progress' | 'resolved') => {
    try {
      await updateComplaintStatus(complaintId, status);
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

  if (userRole === null) {
    // Auto-open auth modal if not already authenticated and not choosing public
    if (!isAuthenticated && !showAuthModal) {
      // User will see the initial screen
    }

    return (
      <>
        <div className="h-screen w-full flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md w-full space-y-8 p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="text-center">
               <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/40">
                  <Shield size={32} className="text-white" />
               </div>
               <h1 className="text-2xl font-black tracking-tight text-white mb-2">PROJECT DRISHTI</h1>
               <p className="text-sm text-slate-500">Security & Event Awareness Platform</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <button 
                  onClick={() => setUserRole('public')}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all font-bold text-slate-200 group"
               >
                  <Eye size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  Access Public Dashboard
               </button>
               
               <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-4 text-slate-600 font-bold">Commander Portal</span></div>
               </div>

               <button 
                  onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-bold text-white shadow-lg shadow-blue-900/20 group"
               >
                  <Lock size={20} className="group-hover:scale-110 transition-transform" />
                  Admin Login
               </button>
            </div>

            <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-black pt-4">Mumbai Music Festival 2024</p>
          </div>
        </div>

        {/* Authentication Modal */}
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
            onSignUp={handleSignUp}
            onSignIn={handleSignIn}
          />
        )}
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* Dashboard Tabs */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => setDashboardView('live-feed')}
                  className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                    dashboardView === 'live-feed'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dashboardView === 'live-feed' ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    Live Feed
                  </div>
                </button>
                <button
                  onClick={() => setDashboardView('tactical-map')}
                  className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                    dashboardView === 'tactical-map'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapIcon size={16} />
                    Tactical Map
                  </div>
                </button>
              </div>
              
              {dashboardView === 'live-feed' && videoSource && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {videoSource.type === 'youtube' ? 'YouTube' : 'Local'} Source Active
                  </span>
                </div>
              )}
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 min-h-0 p-6 overflow-auto">
              {dashboardView === 'live-feed' ? (
                <LiveFeedPlayer 
                  videoSource={videoSource}
                  onZonesUpdated={(updatedZones) => {
                    console.log('🔄 Updating zones from AI analysis:', updatedZones);
                    setZones(updatedZones);
                  }}
                  onIncidentDetected={(incident) => {
                    setIncidents(prev => [incident, ...prev]);
                  }}
                  onAnnouncementCreated={async (title, content, priority) => {
                    const announcement = {
                      id: `ANN-AUTO-${Date.now()}`,
                      title,
                      content,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      priority
                    };
                    setAnnouncements(prev => [announcement, ...prev]);
                  }}
                  onAnalysisStatusChange={(isActive) => {
                    console.log('📊 Video analysis status:', isActive ? 'ACTIVE' : 'STOPPED');
                    setIsVideoAnalysisActive(isActive);
                  }}
                />
              ) : (
                <EventMap zones={zones} incidents={incidents} />
              )}
            </div>
          </div>
        );

      case 'announcements':
        // Mark announcements as seen when user views this page
        if (newAnnouncementsCount > 0 && userRole === 'public') {
          setLastSeenAnnouncementCount(announcements.length);
          setNewAnnouncementsCount(0);
        }
        
        return (
          <div className="max-w-4xl mx-auto space-y-8 pb-8 overflow-y-auto overflow-x-hidden h-full pr-4">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-2xl font-black text-white">Event Announcements</h2>
                  <p className="text-sm text-slate-500">Live updates from event commanders.</p>
               </div>
               {userRole === 'admin' && (
                 <span className="px-3 py-1 bg-blue-600/10 border border-blue-600/30 text-blue-500 text-[10px] font-black uppercase rounded-full">Publisher Mode</span>
               )}
            </div>

            {userRole === 'admin' && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
                 <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Send size={16} className="text-blue-500" />
                    Broadcast Message
                 </h3>
                 <form onSubmit={handleAddAnnouncement} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Title" 
                      value={newAnnouncement.title}
                      onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      required
                    />
                    <textarea 
                      placeholder="Announcement content..." 
                      value={newAnnouncement.content}
                      onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      required
                    />
                    <div className="flex items-center justify-between">
                       <select 
                          value={newAnnouncement.priority}
                          onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none"
                       >
                          <option value="normal">Normal Priority</option>
                          <option value="urgent">Urgent Priority</option>
                       </select>
                       <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20">
                          Send Broadcast
                       </button>
                    </div>
                 </form>
              </div>
            )}

            <div className="space-y-4">
               {announcements.map(ann => (
                 <div key={ann.id} className={`p-6 rounded-2xl border ${ann.priority === 'urgent' ? 'bg-orange-500/5 border-orange-500/30' : 'bg-slate-900/40 border-slate-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${ann.priority === 'urgent' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                             <Bell size={18} />
                          </div>
                          <h4 className="font-bold text-slate-200">{ann.title}</h4>
                       </div>
                       <span className="text-[10px] font-bold text-slate-600">{ann.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed pl-12">{ann.content}</p>
                 </div>
               ))}
            </div>
          </div>
        );

      case 'bottleneck':
        return (
          <div className="space-y-6 pb-8 overflow-auto h-full">
            <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Activity size={24} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Predictive Bottleneck Analysis</h2>
                  <p className="text-xs text-slate-500">Forecasting crowd flow using Vertex AI Forecasting.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zones.map(zone => (
                   <div key={zone.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-sm text-slate-300">{zone.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${zone.density > 80 ? 'bg-red-950/40 text-red-500 border border-red-900/50' : 'bg-emerald-950/40 text-emerald-500 border border-emerald-900/50'}`}>
                          {zone.density > 80 ? 'CRITICAL' : 'OPTIMAL'}
                        </span>
                      </div>
                      <div className="flex items-end gap-1 h-24 mb-4">
                        {[34, 45, 52, 48, 61, 75, zone.density, zone.predictedDensity].map((val, idx) => (
                          <div 
                            key={idx} 
                            className={`flex-1 rounded-t-sm transition-all duration-1000 ${idx === 7 ? 'bg-blue-500/80 animate-pulse border-t-2 border-white' : idx === 6 ? 'bg-slate-700' : 'bg-slate-800/50'}`} 
                            style={{ height: `${val}%` }}
                          ></div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>Current: {Math.round(zone.density)}%</span>
                        <span className="text-blue-400">+20m: {zone.predictedDensity}%</span>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'complaints':
        return (
          <div className="overflow-auto h-full">
            <ComplaintLaunch
              isAdmin={userRole === 'admin'}
              userEmail={userRole === 'admin' ? 'admin@drishti.com' : 'public@user.com'}
              complaints={complaints}
              onSubmitComplaint={handleSubmitComplaint}
              onRevokeComplaint={handleRevokeComplaint}
              onReplyToComplaint={handleReplyToComplaint}
              onUpdateStatus={handleUpdateComplaintStatus}
            />
          </div>
        );

      case 'incidents':
        return (
          <div className="space-y-6 pb-8 overflow-auto h-full">
            <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-bold">Security Incidents Feed</h2>
                 <p className="text-xs text-slate-500">Real-time status of all field operations.</p>
              </div>
              {userRole === 'admin' && (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2">
                   <Plus size={16} /> Log Incident
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {incidents.map(incident => (
                  <div key={incident.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${incident.type === 'medical' ? 'bg-red-500/10 text-red-500' : incident.type === 'security' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                           {incident.type === 'medical' ? <Siren size={20} /> : <Shield size={20} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 flex items-center gap-2">
                             {incident.id}: {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                             {incident.priority === 'high' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                          </h4>
                          <p className="text-[11px] text-slate-500">Reported at {incident.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${incident.status === 'dispatched' ? 'bg-blue-600 text-white' : incident.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                           {incident.status}
                         </span>
                         {userRole === 'admin' && (
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => updateIncidentStatus(incident.id, 'dispatched')} title="Mark Dispatched" className="p-1.5 hover:bg-blue-600 rounded text-slate-400 hover:text-white"><Send size={14}/></button>
                              <button onClick={() => updateIncidentStatus(incident.id, 'resolved')} title="Mark Resolved" className="p-1.5 hover:bg-emerald-600 rounded text-slate-400 hover:text-white"><CheckCircle size={14}/></button>
                           </div>
                         )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 italic">
                      "{incident.description}"
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-500" />
                          <span className="text-xs font-bold text-slate-400 uppercase">{zones.find(z => z.id === incident.location)?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-orange-500" />
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{incident.priority} RISK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {userRole === 'admin' && (
                <div className="space-y-6">
                   <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-0">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Plus size={16} className="text-blue-500" /> Manual Entry</h3>
                      <form onSubmit={handleAddIncident} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="text-[10px] text-slate-600 font-black uppercase mb-1 block">Type</label>
                              <select 
                                value={newIncident.type}
                                onChange={e => setNewIncident({...newIncident, type: e.target.value as any})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                              >
                                <option value="medical">Medical</option>
                                <option value="security">Security</option>
                                <option value="anomaly">Anomaly</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-[10px] text-slate-600 font-black uppercase mb-1 block">Zone</label>
                              <select 
                                value={newIncident.location}
                                onChange={e => setNewIncident({...newIncident, location: e.target.value as any})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                              >
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                              </select>
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] text-slate-600 font-black uppercase mb-1 block">Priority</label>
                           <div className="flex gap-2">
                              {['low', 'medium', 'high'].map(p => (
                                <button 
                                  key={p} 
                                  type="button"
                                  onClick={() => setNewIncident({...newIncident, priority: p as any})}
                                  className={`flex-1 py-1 rounded text-[9px] font-black uppercase border transition-all ${newIncident.priority === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                                >
                                  {p}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] text-slate-600 font-black uppercase mb-1 block">Description</label>
                           <textarea 
                              value={newIncident.description}
                              onChange={e => setNewIncident({...newIncident, description: e.target.value})}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs min-h-[80px] focus:outline-none"
                              placeholder="Incident details..."
                           />
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-900/20">
                           Report to Agent
                        </button>
                      </form>
                   </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'config':
        return (
          <div className="max-w-5xl mx-auto space-y-8 pb-20 overflow-auto h-full">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  <Settings size={24} className="text-slate-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Commander Configuration</h2>
                  <p className="text-sm text-slate-500">Manage event global parameters and SOS routing.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Attendee Management Section */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
                   <h3 className="text-lg font-bold flex items-center gap-2"><Users size={20} className="text-blue-500" /> Live Attendance Tracking</h3>
                   <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold mb-1 block">Total Live Attendees</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={attendeeCount}
                            onChange={e => setAttendeeCount(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/50 outline-none"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-bold uppercase">Manual Override</div>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-2">Adjusting this value updates telemetry for the risk score engine instantly.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
                   <h3 className="text-lg font-bold flex items-center gap-2"><Phone size={20} className="text-emerald-500" /> SOS Contact Center</h3>
                   <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold mb-1 block">Primary Emergency Phone</label>
                        <input 
                          type="text" 
                          value={emergencyConfig.contactPhone}
                          onChange={e => setEmergencyConfig({...emergencyConfig, contactPhone: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none"
                        />
                      </div>
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                         <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Drishti Routing</p>
                         <p className="text-xs text-slate-400">All public SOS requests will be routed to this contact via Google Maps Grounding optimization.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6 md:col-span-2">
                   <h3 className="text-lg font-bold flex items-center gap-2"><MapIcon size={20} className="text-purple-500" /> Tactical Base Location</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <label className="text-xs text-slate-500 font-bold mb-1 block">Location Label</label>
                        <input 
                          type="text" 
                          value={emergencyConfig.locationName}
                          onChange={e => setEmergencyConfig({...emergencyConfig, locationName: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none"
                        />
                      </div>
                      <div className="md:col-span-1">
                          <label className="text-xs text-slate-500 font-bold mb-1 block">Latitude</label>
                          <input 
                            type="number" 
                            step="any"
                            value={emergencyConfig.latitude}
                            onChange={e => setEmergencyConfig({...emergencyConfig, latitude: parseFloat(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-xs text-slate-500 font-bold mb-1 block">Longitude</label>
                          <input 
                            type="number" 
                            step="any"
                            value={emergencyConfig.longitude}
                            onChange={e => setEmergencyConfig({...emergencyConfig, longitude: parseFloat(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none"
                          />
                        </div>
                   </div>
                </div>
             </div>

             {/* Video Input Management */}
             <VideoInputManager 
               onSave={handleSaveVideoSource}
               onDelete={handleDeleteVideoSource}
               currentVideo={videoSource}
             />
             
             <div className="flex justify-end items-center gap-4 mt-8">
                {showSavedMessage && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg animate-pulse">
                    <CheckCircle size={18} />
                    <span className="font-bold text-sm">Saved! Redirecting to Dashboard...</span>
                  </div>
                )}
                <button 
                  onClick={handleSaveEventConfig}
                  disabled={showSavedMessage}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Event Protocol
                </button>
             </div>
          </div>
        );

      default:
        return <div className="text-center py-20 text-slate-500">Module under development.</div>;
    }
  };

  return (
    <>
      <Layout 
        userRole={userRole}
        onLogout={handleLogout}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        incidentCount={incidents.filter(i => i.status !== 'resolved').length}
        newAnnouncementsCount={newAnnouncementsCount}
        onSOSClick={() => setIsEmergencyActive(true)}
        onAgentClick={() => setIsSummaryOpen(!isSummaryOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        riskScore={riskAssessment.score}
        onRiskClick={() => setIsRiskOverlayOpen(true)}
        attendeeCount={attendeeCount}
      >
        {renderContent()}
      </Layout>

      {/* Floating Agent Drawer */}
      <div 
        className={`fixed top-16 bottom-0 right-0 w-96 z-40 bg-slate-950/80 backdrop-blur-xl border-l border-slate-800 transition-transform duration-500 ease-out shadow-2xl ${
          isSummaryOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col p-4">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Drishti Intelligence Feed</h3>
            <button onClick={() => setIsSummaryOpen(false)} className="text-slate-500 hover:text-white p-2">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-800 shadow-inner">
             <SituationalSummaryPanel zones={zones} incidents={incidents} />
          </div>
        </div>
      </div>

      {/* Emergency SOS Overlay */}
      {isEmergencyActive && (
        <EmergencyOverlay 
          onClose={() => setIsEmergencyActive(false)}
          emergencyConfig={{
            locationName: eventConfig.locationName,
            contactPhone: eventConfig.emergencyContactPhone,
            latitude: eventConfig.latitude,
            longitude: eventConfig.longitude
          }}
        />
      )}

      {/* Risk Score Overlay */}
      {isRiskOverlayOpen && (
        <RiskScoreOverlay 
          score={riskAssessment.score}
          factors={riskAssessment.factors}
          onClose={() => setIsRiskOverlayOpen(false)}
        />
      )}

    </>
  );
};

export default App;
