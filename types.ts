
export enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export type UserRole = 'public' | 'admin';

export interface Zone {
  id: string;
  name: string;
  density: number; // 0 to 100
  predictedDensity: number; // Forecast for 15-20 mins
  status: 'normal' | 'congested' | 'bottleneck';
}

export interface Incident {
  id: string;
  type: 'medical' | 'security' | 'fire' | 'anomaly';
  location: string;
  status: 'reported' | 'dispatched' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  subject: string;
  details: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  department: 'security' | 'medical' | 'facilities' | 'crowd-management' | 'general';
  status: 'open' | 'in-progress' | 'resolved' | 'revoked';
  submittedBy: string; // User ID/email
  submittedAt: string;
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  priority: 'normal' | 'urgent';
}

export interface EmergencyConfig {
  locationName: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
}

export interface VideoSource {
  id: string;
  type: 'youtube' | 'local';
  url: string;
  fileName?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}
