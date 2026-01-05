import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Zone, Incident, Announcement } from '../types';

// Collection names
const COLLECTIONS = {
  ZONES: 'zones',
  INCIDENTS: 'incidents',
  ANNOUNCEMENTS: 'announcements',
  METRICS: 'metrics',
  RISK_SCORES: 'riskScores',
  CONFIG: 'config',
  VIDEO_SOURCE: 'videoSource',
  COMPLAINTS: 'complaints'
};

// ============= ZONES =============

/**
 * Save or update zone data
 */
export const saveZone = async (zone: Zone): Promise<void> => {
  try {
    const zoneRef = doc(db, COLLECTIONS.ZONES, zone.id);
    await setDoc(zoneRef, {
      ...zone,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving zone:', error);
    throw error;
  }
};

/**
 * Save multiple zones at once - Only saves the 6 fixed zones (A-F)
 */
export const saveZones = async (zones: Zone[]): Promise<void> => {
  try {
    // Filter to only the 6 fixed zones
    const validZones = zones.filter(z => 
      ['zone-a', 'zone-b', 'zone-c', 'zone-d', 'zone-e', 'zone-f'].includes(z.id)
    ).slice(0, 6);
    
    if (validZones.length === 0) {
      console.warn('⚠️ No valid zones to save');
      return;
    }
    
    console.log(`💾 Saving ${validZones.length} fixed zones to Firebase...`);
    const promises = validZones.map(zone => saveZone(zone));
    await Promise.all(promises);
    console.log(`✅ Successfully saved ${validZones.length} zones`);
  } catch (error) {
    console.error('Error saving zones:', error);
    throw error;
  }
};

/**
 * Get all zones
 */
export const getZones = async (): Promise<Zone[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ZONES));
    const zones: Zone[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      zones.push({
        id: doc.id,
        name: data.name,
        density: data.density,
        predictedDensity: data.predictedDensity,
        status: data.status
      });
    });
    return zones;
  } catch (error) {
    console.error('Error getting zones:', error);
    throw error;
  }
};

/**
 * Listen to real-time zone updates
 */
export const listenToZones = (callback: (zones: Zone[]) => void) => {
  const q = query(collection(db, COLLECTIONS.ZONES));
  return onSnapshot(q, (querySnapshot) => {
    const zones: Zone[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      zones.push({
        id: doc.id,
        name: data.name,
        density: data.density,
        predictedDensity: data.predictedDensity,
        status: data.status
      });
    });
    callback(zones);
  });
};

// ============= INCIDENTS =============

/**
 * Add a new incident
 */
export const addIncident = async (incident: Incident): Promise<string> => {
  try {
    const incidentRef = doc(db, COLLECTIONS.INCIDENTS, incident.id);
    await setDoc(incidentRef, {
      ...incident,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return incident.id;
  } catch (error) {
    console.error('Error adding incident:', error);
    throw error;
  }
};

/**
 * Update incident status
 */
export const updateIncidentStatus = async (incidentId: string, status: Incident['status']): Promise<void> => {
  try {
    const incidentRef = doc(db, COLLECTIONS.INCIDENTS, incidentId);
    await updateDoc(incidentRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating incident status:', error);
    throw error;
  }
};

/**
 * Get all incidents
 */
export const getIncidents = async (): Promise<Incident[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.INCIDENTS), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const incidents: Incident[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      incidents.push({
        id: doc.id,
        type: data.type,
        location: data.location,
        status: data.status,
        priority: data.priority,
        timestamp: data.timestamp,
        description: data.description
      });
    });
    return incidents;
  } catch (error) {
    console.error('Error getting incidents:', error);
    throw error;
  }
};

/**
 * Listen to real-time incident updates
 */
export const listenToIncidents = (callback: (incidents: Incident[]) => void) => {
  const q = query(collection(db, COLLECTIONS.INCIDENTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const incidents: Incident[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      incidents.push({
        id: doc.id,
        type: data.type,
        location: data.location,
        status: data.status,
        priority: data.priority,
        timestamp: data.timestamp,
        description: data.description
      });
    });
    callback(incidents);
  });
};

/**
 * Delete all incidents - Used when resetting for a new event video
 */
export const deleteAllIncidents = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.INCIDENTS));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`🗑️ Deleted ${querySnapshot.size} incidents from database`);
  } catch (error) {
    console.error('Error deleting all incidents:', error);
    throw error;
  }
};

// ============= ANNOUNCEMENTS =============

/**
 * Add a new announcement
 */
export const addAnnouncement = async (announcement: Announcement): Promise<string> => {
  try {
    const announcementRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, announcement.id);
    await setDoc(announcementRef, {
      ...announcement,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return announcement.id;
  } catch (error) {
    console.error('Error adding announcement:', error);
    throw error;
  }
};

/**
 * Get all announcements
 */
export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const announcements: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      announcements.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        timestamp: data.timestamp,
        priority: data.priority
      });
    });
    return announcements;
  } catch (error) {
    console.error('Error getting announcements:', error);
    throw error;
  }
};

/**
 * Listen to real-time announcement updates
 */
export const listenToAnnouncements = (callback: (announcements: Announcement[]) => void) => {
  const q = query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const announcements: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      announcements.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        timestamp: data.timestamp,
        priority: data.priority
      });
    });
    callback(announcements);
  });
};

/**
 * Delete all announcements - Used when resetting for a new event video
 */
export const deleteAllAnnouncements = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ANNOUNCEMENTS));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`🗑️ Deleted ${querySnapshot.size} announcements from database`);
  } catch (error) {
    console.error('Error deleting all announcements:', error);
    throw error;
  }
};

// ============= METRICS =============

export interface VideoMetrics {
  timestamp: string;
  totalPeople: number;
  crowdDensity: number;
  avgMovementSpeed: number;
  anomalyDetections: number;
  zoneId?: string;
}

/**
 * Save video metrics from live feed
 */
export const saveVideoMetrics = async (metrics: VideoMetrics): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.METRICS), {
      ...metrics,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving video metrics:', error);
    throw error;
  }
};

/**
 * Get recent video metrics
 */
export const getRecentMetrics = async (limitCount: number = 50): Promise<VideoMetrics[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.METRICS),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const metrics: VideoMetrics[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      metrics.push({
        timestamp: data.timestamp,
        totalPeople: data.totalPeople,
        crowdDensity: data.crowdDensity,
        avgMovementSpeed: data.avgMovementSpeed,
        anomalyDetections: data.anomalyDetections,
        zoneId: data.zoneId
      });
    });
    return metrics;
  } catch (error) {
    console.error('Error getting metrics:', error);
    throw error;
  }
};

// ============= RISK SCORES =============

export interface RiskScoreData {
  score: number;
  level: string;
  factors: any[];
  timestamp: string;
}

/**
 * Save risk score calculation
 */
export const saveRiskScore = async (riskData: RiskScoreData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.RISK_SCORES), {
      ...riskData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving risk score:', error);
    throw error;
  }
};

/**
 * Get recent risk scores
 */
export const getRecentRiskScores = async (limitCount: number = 20): Promise<RiskScoreData[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.RISK_SCORES),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const riskScores: RiskScoreData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      riskScores.push({
        score: data.score,
        level: data.level,
        factors: data.factors,
        timestamp: data.timestamp
      });
    });
    return riskScores;
  } catch (error) {
    console.error('Error getting risk scores:', error);
    throw error;
  }
};

// ============= CONFIG =============

export interface EventConfig {
  attendeeCount: number;
  emergencyContactPhone: string;
  locationName: string;
  latitude: number;
  longitude: number;
  eventName?: string;
  sosMapLinks?: {
    policeStation: string;
    hospital: string;
    fireStation: string;
  };
}

/**
 * Save event configuration
 */
export const saveEventConfig = async (config: EventConfig): Promise<void> => {
  try {
    const configRef = doc(db, COLLECTIONS.CONFIG, 'event-config');
    await setDoc(configRef, {
      ...config,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving event config:', error);
    throw error;
  }
};

/**
 * Get event configuration
 */
export const getEventConfig = async (): Promise<EventConfig | null> => {
  try {
    const configRef = doc(db, COLLECTIONS.CONFIG, 'event-config');
    const docSnap = await getDoc(configRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        attendeeCount: data.attendeeCount,
        emergencyContactPhone: data.emergencyContactPhone,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        eventName: data.eventName,
        sosMapLinks: data.sosMapLinks
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting event config:', error);
    throw error;
  }
};

/**
 * Listen to event config changes
 */
export const listenToEventConfig = (callback: (config: EventConfig | null) => void) => {
  const configRef = doc(db, COLLECTIONS.CONFIG, 'event-config');
  return onSnapshot(configRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        attendeeCount: data.attendeeCount,
        emergencyContactPhone: data.emergencyContactPhone,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        eventName: data.eventName,
        sosMapLinks: data.sosMapLinks
      });
    } else {
      callback(null);
    }
  });
};

// ============= VIDEO SOURCE =============

export interface VideoSourceData {
  id: string;
  type: 'youtube' | 'local';
  url: string;
  fileName?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

/**
 * Save or update video source
 */
export const saveVideoSource = async (videoSource: VideoSourceData): Promise<void> => {
  try {
    const videoRef = doc(db, COLLECTIONS.VIDEO_SOURCE, 'current-video');
    
    // Clean data - remove undefined fields
    const cleanData: any = {
      id: videoSource.id,
      type: videoSource.type,
      url: videoSource.url,
      uploadedAt: videoSource.uploadedAt,
      updatedAt: serverTimestamp()
    };
    
    // Only add fileName if it exists (for local videos)
    if (videoSource.fileName) {
      cleanData.fileName = videoSource.fileName;
    }
    
    // Only add uploadedBy if it exists
    if (videoSource.uploadedBy) {
      cleanData.uploadedBy = videoSource.uploadedBy;
    }
    
    await setDoc(videoRef, cleanData);
  } catch (error) {
    console.error('Error saving video source:', error);
    throw error;
  }
};

/**
 * Get current video source
 */
export const getVideoSource = async (): Promise<VideoSourceData | null> => {
  try {
    const videoRef = doc(db, COLLECTIONS.VIDEO_SOURCE, 'current-video');
    const docSnap = await getDoc(videoRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: data.id,
        type: data.type,
        url: data.url,
        fileName: data.fileName,
        uploadedAt: data.uploadedAt,
        uploadedBy: data.uploadedBy
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting video source:', error);
    throw error;
  }
};

/**
 * Listen to video source changes
 */
export const listenToVideoSource = (callback: (videoSource: VideoSourceData | null) => void) => {
  const videoRef = doc(db, COLLECTIONS.VIDEO_SOURCE, 'current-video');
  return onSnapshot(videoRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        id: data.id,
        type: data.type,
        url: data.url,
        fileName: data.fileName,
        uploadedAt: data.uploadedAt,
        uploadedBy: data.uploadedBy
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Delete current video source
 */
export const deleteVideoSource = async (): Promise<void> => {
  try {
    const videoRef = doc(db, COLLECTIONS.VIDEO_SOURCE, 'current-video');
    await deleteDoc(videoRef);
  } catch (error) {
    console.error('Error deleting video source:', error);
    throw error;
  }
};

// ============= COMPLAINTS =============

export interface ComplaintData {
  id: string;
  subject: string;
  details: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  department: 'security' | 'medical' | 'facilities' | 'crowd-management' | 'general';
  status: 'open' | 'in-progress' | 'resolved' | 'revoked';
  submittedBy: string;
  submittedAt: string;
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: string;
}

/**
 * Add a new complaint
 */
export const addComplaint = async (complaint: ComplaintData): Promise<void> => {
  try {
    const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaint.id);
    await setDoc(complaintRef, {
      ...complaint,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding complaint:', error);
    throw error;
  }
};

/**
 * Listen to complaints in real-time
 */
export const listenToComplaints = (callback: (complaints: ComplaintData[]) => void) => {
  const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
  const q = query(complaintsRef, orderBy('submittedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const complaints: ComplaintData[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      complaints.push({
        id: doc.id,
        subject: data.subject,
        details: data.details,
        importance: data.importance,
        department: data.department,
        status: data.status,
        submittedBy: data.submittedBy,
        submittedAt: data.submittedAt,
        adminReply: data.adminReply,
        repliedBy: data.repliedBy,
        repliedAt: data.repliedAt
      });
    });
    callback(complaints);
  });
};

/**
 * Update complaint status (for admin - mark as in-progress or resolved)
 */
export const updateComplaintStatus = async (
  complaintId: string, 
  status: 'open' | 'in-progress' | 'resolved'
): Promise<void> => {
  try {
    const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
    await updateDoc(complaintRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
};

/**
 * Add admin reply to complaint
 */
export const addComplaintReply = async (
  complaintId: string, 
  reply: string, 
  adminEmail: string
): Promise<void> => {
  try {
    const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
    await updateDoc(complaintRef, {
      adminReply: reply,
      repliedBy: adminEmail,
      repliedAt: new Date().toISOString(),
      status: 'in-progress',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding complaint reply:', error);
    throw error;
  }
};

/**
 * Revoke complaint (user can revoke their own complaint)
 */
export const revokeComplaint = async (complaintId: string): Promise<void> => {
  try {
    const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
    await updateDoc(complaintRef, {
      status: 'revoked',
      revokedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error revoking complaint:', error);
    throw error;
  }
};
