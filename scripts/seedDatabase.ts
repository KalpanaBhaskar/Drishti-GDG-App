/**
 * Database Seeding Script for Drishti
 * 
 * This script initializes the Firebase Firestore database with sample data
 * Run with: npm run seed-db
 */

import { 
  saveZones, 
  addIncident, 
  addAnnouncement, 
  saveEventConfig,
  saveRiskScore,
  saveVideoMetrics 
} from '../services/firestoreService';

// Sample Zones Data
const SAMPLE_ZONES = [
  {
    id: 'zone-main-stage',
    name: 'Main Stage',
    density: 75,
    predictedDensity: 82,
    status: 'congested' as const
  },
  {
    id: 'zone-north-entrance',
    name: 'North Entrance',
    density: 45,
    predictedDensity: 50,
    status: 'normal' as const
  },
  {
    id: 'zone-south-entrance',
    name: 'South Entrance',
    density: 38,
    predictedDensity: 42,
    status: 'normal' as const
  },
  {
    id: 'zone-food-court',
    name: 'Food Court',
    density: 62,
    predictedDensity: 58,
    status: 'normal' as const
  },
  {
    id: 'zone-emergency-exit',
    name: 'Emergency Exit',
    density: 15,
    predictedDensity: 18,
    status: 'normal' as const
  },
  {
    id: 'zone-vip-area',
    name: 'VIP Area',
    density: 30,
    predictedDensity: 35,
    status: 'normal' as const
  },
  {
    id: 'zone-parking',
    name: 'Parking Zone',
    density: 55,
    predictedDensity: 48,
    status: 'normal' as const
  },
  {
    id: 'zone-restrooms',
    name: 'Restroom Area',
    density: 88,
    predictedDensity: 92,
    status: 'bottleneck' as const
  }
];

// Sample Incidents
const SAMPLE_INCIDENTS = [
  {
    id: 'INC-001',
    type: 'medical' as const,
    location: 'Main Stage',
    status: 'dispatched' as const,
    priority: 'high' as const,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: 'Minor injury reported near barrier. Medical team dispatched.'
  },
  {
    id: 'INC-002',
    type: 'security' as const,
    location: 'North Entrance',
    status: 'resolved' as const,
    priority: 'medium' as const,
    timestamp: new Date(Date.now() - 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: 'Suspicious package investigation. All clear.'
  },
  {
    id: 'INC-003',
    type: 'anomaly' as const,
    location: 'Restroom Area',
    status: 'reported' as const,
    priority: 'high' as const,
    timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: 'Unusual crowd buildup detected. Monitoring situation.'
  }
];

// Sample Announcements
const SAMPLE_ANNOUNCEMENTS = [
  {
    id: 'ANN-001',
    title: 'Welcome to Mumbai Music Festival 2024',
    content: 'Event has officially started. Please follow safety guidelines and enjoy responsibly.',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    priority: 'normal' as const
  },
  {
    id: 'ANN-002',
    title: 'Headliner Performance Starting Soon',
    content: 'Main stage performance begins in 15 minutes. Please proceed to designated areas.',
    timestamp: new Date(Date.now() - 900000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    priority: 'normal' as const
  },
  {
    id: 'ANN-003',
    title: '⚠️ CROWD ALERT - Restroom Area',
    content: 'High congestion detected near restrooms. Please use alternative facilities.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    priority: 'urgent' as const
  }
];

// Event Configuration
const SAMPLE_CONFIG = {
  attendeeCount: 45280,
  emergencyContactPhone: '+91-9876543210',
  locationName: 'Mumbai Central First Aid Hub',
  latitude: 19.0760,
  longitude: 72.8777
};

// Sample Risk Score
const SAMPLE_RISK_SCORE = {
  score: 68,
  level: 'HIGH',
  factors: [
    { name: 'Crowd Density', value: 75, weight: 0.4 },
    { name: 'Active Incidents', value: 3, weight: 0.3 },
    { name: 'Bottlenecks', value: 1, weight: 0.2 },
    { name: 'Weather Conditions', value: 0, weight: 0.1 }
  ],
  timestamp: new Date().toISOString()
};

// Sample Video Metrics
const SAMPLE_METRICS = SAMPLE_ZONES.map(zone => ({
  timestamp: new Date().toISOString(),
  totalPeople: Math.floor(zone.density * 100),
  crowdDensity: zone.density,
  avgMovementSpeed: Math.random() * 2,
  anomalyDetections: zone.density > 80 ? Math.floor(Math.random() * 3) : 0,
  zoneId: zone.id
}));

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Zones
    console.log('📍 Seeding zones...');
    await saveZones(SAMPLE_ZONES);
    console.log(`✅ Successfully seeded ${SAMPLE_ZONES.length} zones\n`);

    // 2. Seed Incidents
    console.log('🚨 Seeding incidents...');
    for (const incident of SAMPLE_INCIDENTS) {
      await addIncident(incident);
    }
    console.log(`✅ Successfully seeded ${SAMPLE_INCIDENTS.length} incidents\n`);

    // 3. Seed Announcements
    console.log('📢 Seeding announcements...');
    for (const announcement of SAMPLE_ANNOUNCEMENTS) {
      await addAnnouncement(announcement);
    }
    console.log(`✅ Successfully seeded ${SAMPLE_ANNOUNCEMENTS.length} announcements\n`);

    // 4. Seed Event Configuration
    console.log('⚙️ Seeding event configuration...');
    await saveEventConfig(SAMPLE_CONFIG);
    console.log('✅ Successfully seeded event configuration\n');

    // 5. Seed Risk Score
    console.log('📊 Seeding risk score...');
    await saveRiskScore(SAMPLE_RISK_SCORE);
    console.log('✅ Successfully seeded risk score\n');

    // 6. Seed Video Metrics
    console.log('📹 Seeding video metrics...');
    for (const metric of SAMPLE_METRICS) {
      await saveVideoMetrics(metric);
    }
    console.log(`✅ Successfully seeded ${SAMPLE_METRICS.length} video metrics\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Zones: ${SAMPLE_ZONES.length}`);
    console.log(`   - Incidents: ${SAMPLE_INCIDENTS.length}`);
    console.log(`   - Announcements: ${SAMPLE_ANNOUNCEMENTS.length}`);
    console.log(`   - Metrics: ${SAMPLE_METRICS.length}`);
    console.log(`   - Risk Scores: 1`);
    console.log(`   - Event Config: 1`);
    console.log('\n✨ Your Firestore database is now populated with sample data!');
    console.log('🌐 View your data at: https://console.firebase.google.com/');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('\n⚠️  Make sure you have:');
    console.error('   1. Created a Firebase project');
    console.error('   2. Enabled Firestore database');
    console.error('   3. Set up environment variables in .env.local');
    console.error('   4. Started your app at least once to initialize Firebase');
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
