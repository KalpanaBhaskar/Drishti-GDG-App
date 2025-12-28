/**
 * Firebase Cleanup Script
 * Removes old zones and ensures only 6 fixed zones (A-F) exist
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';

// Firebase configuration (from your .env.local)
const firebaseConfig = {
  apiKey: "AIzaSyCpwHM0j6x9r6sNxOxYBNT1Ds5Vv6xHilk",
  authDomain: "drishti-bf2fc.firebaseapp.com",
  projectId: "drishti-bf2fc",
  storageBucket: "drishti-bf2fc.firebasestorage.app",
  messagingSenderId: "84044832861",
  appId: "1:84044832861:web:9a9dec7e5f64e8e54df8b5",
  measurementId: "G-FNQQYQGLGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define the 6 fixed zones that should always exist
const FIXED_ZONES = [
  { id: 'zone-a', name: 'Zone A', density: 45, predictedDensity: 50, status: 'normal' },
  { id: 'zone-b', name: 'Zone B', density: 62, predictedDensity: 68, status: 'congested' },
  { id: 'zone-c', name: 'Zone C', density: 78, predictedDensity: 85, status: 'bottleneck' },
  { id: 'zone-d', name: 'Zone D', density: 38, predictedDensity: 42, status: 'normal' },
  { id: 'zone-e', name: 'Zone E', density: 55, predictedDensity: 60, status: 'normal' },
  { id: 'zone-f', name: 'Zone F', density: 50, predictedDensity: 55, status: 'normal' },
];

const VALID_ZONE_IDS = ['zone-a', 'zone-b', 'zone-c', 'zone-d', 'zone-e', 'zone-f'];

async function cleanupZones() {
  console.log('🧹 Starting zone cleanup...\n');
  
  try {
    // Get all zones from Firebase
    const zonesRef = collection(db, 'zones');
    const snapshot = await getDocs(zonesRef);
    
    console.log(`Found ${snapshot.size} zones in Firebase\n`);
    
    let deletedCount = 0;
    let keptCount = 0;
    
    // Delete any zone that's not in our fixed list
    for (const docSnapshot of snapshot.docs) {
      const zoneId = docSnapshot.id;
      
      if (!VALID_ZONE_IDS.includes(zoneId)) {
        console.log(`❌ Deleting old zone: ${zoneId}`);
        await deleteDoc(doc(db, 'zones', zoneId));
        deletedCount++;
      } else {
        console.log(`✅ Keeping fixed zone: ${zoneId}`);
        keptCount++;
      }
    }
    
    console.log(`\n📊 Cleanup Results:`);
    console.log(`   Deleted: ${deletedCount} old zones`);
    console.log(`   Kept: ${keptCount} valid zones`);
    
    // Ensure all 6 fixed zones exist
    console.log('\n🔧 Ensuring all 6 fixed zones exist...\n');
    
    for (const zone of FIXED_ZONES) {
      const zoneRef = doc(db, 'zones', zone.id);
      await setDoc(zoneRef, {
        ...zone,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Zone ${zone.id} (${zone.name}) ensured`);
    }
    
    console.log('\n✅ Zone cleanup complete!\n');
    console.log('📍 Only 6 fixed zones now exist: A, B, C, D, E, F');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function viewAllData() {
  console.log('\n\n📊 FIREBASE DATABASE INSPECTION\n');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // View Zones
    console.log('🗺️  ZONES:');
    console.log('─────────────────────────────────────');
    const zonesSnapshot = await getDocs(collection(db, 'zones'));
    zonesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   ${doc.id}: ${data.name} - ${data.density}% density, Status: ${data.status}`);
    });
    console.log(`   Total: ${zonesSnapshot.size} zones\n`);
    
    // View Incidents
    console.log('🚨 INCIDENTS:');
    console.log('─────────────────────────────────────');
    const incidentsSnapshot = await getDocs(collection(db, 'incidents'));
    incidentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   ${doc.id}: ${data.type} at ${data.location} - ${data.status}`);
      console.log(`      "${data.description}"`);
    });
    console.log(`   Total: ${incidentsSnapshot.size} incidents\n`);
    
    // View Announcements
    console.log('📢 ANNOUNCEMENTS:');
    console.log('─────────────────────────────────────');
    const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
    announcementsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   ${doc.id}: ${data.title} - ${data.priority}`);
      console.log(`      "${data.content}"`);
      console.log(`      Time: ${data.timestamp}`);
    });
    console.log(`   Total: ${announcementsSnapshot.size} announcements\n`);
    
    // View Complaints
    console.log('📝 COMPLAINTS:');
    console.log('─────────────────────────────────────');
    const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
    if (complaintsSnapshot.size === 0) {
      console.log('   No complaints yet\n');
    } else {
      complaintsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   ${doc.id}:`);
        console.log(`      Subject: ${data.subject}`);
        console.log(`      Department: ${data.department}, Importance: ${data.importance}`);
        console.log(`      Status: ${data.status}`);
        console.log(`      By: ${data.submittedBy} at ${data.submittedAt}`);
        if (data.adminReply) {
          console.log(`      Admin Reply: "${data.adminReply}"`);
        }
        console.log('');
      });
      console.log(`   Total: ${complaintsSnapshot.size} complaints\n`);
    }
    
    // View Video Metrics
    console.log('📹 VIDEO METRICS:');
    console.log('─────────────────────────────────────');
    const metricsSnapshot = await getDocs(collection(db, 'video_metrics'));
    console.log(`   Total records: ${metricsSnapshot.size}`);
    if (metricsSnapshot.size > 0) {
      console.log('   Latest 5 entries:');
      const latest = Array.from(metricsSnapshot.docs)
        .sort((a, b) => {
          const aTime = new Date(a.data().timestamp).getTime();
          const bTime = new Date(b.data().timestamp).getTime();
          return bTime - aTime;
        })
        .slice(0, 5);
      
      latest.forEach((doc) => {
        const data = doc.data();
        console.log(`      Zone ${data.zoneId}: ${data.crowdDensity.toFixed(1)}% density`);
      });
    }
    console.log('');
    
    // View Risk Scores
    console.log('⚠️  RISK SCORES:');
    console.log('─────────────────────────────────────');
    const riskSnapshot = await getDocs(collection(db, 'riskScores'));
    console.log(`   Total records: ${riskSnapshot.size}`);
    if (riskSnapshot.size > 0) {
      const latest = Array.from(riskSnapshot.docs)
        .sort((a, b) => {
          const aTime = new Date(a.data().timestamp).getTime();
          const bTime = new Date(b.data().timestamp).getTime();
          return bTime - aTime;
        })[0];
      
      const data = latest.data();
      console.log(`   Latest: ${data.score.toFixed(1)} - ${data.level}`);
    }
    console.log('');
    
    // View Event Config
    console.log('⚙️  EVENT CONFIG:');
    console.log('─────────────────────────────────────');
    const configSnapshot = await getDocs(collection(db, 'config'));
    if (configSnapshot.size > 0) {
      const config = configSnapshot.docs[0].data();
      console.log(`   Attendees: ${config.attendeeCount}`);
      console.log(`   Location: ${config.locationName}`);
      console.log(`   Emergency: ${config.emergencyContactPhone}`);
    } else {
      console.log('   No config set yet');
    }
    console.log('');
    
    console.log('═══════════════════════════════════════');
    console.log('✅ Database inspection complete!\n');
    
  } catch (error) {
    console.error('❌ Error viewing data:', error);
  }
}

// Run the cleanup and inspection
async function main() {
  console.log('\n🚀 Firebase Cleanup & Inspection Tool\n');
  
  // First, cleanup zones
  await cleanupZones();
  
  // Then, view all data
  await viewAllData();
  
  console.log('✅ All done! Firebase database is clean and organized.\n');
  process.exit(0);
}

main();
