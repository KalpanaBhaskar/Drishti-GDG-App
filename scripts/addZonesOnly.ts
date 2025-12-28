/**
 * Simple script to add 6 fixed zones to Firestore
 * Run with: npm run add-zones
 */

import { db } from '../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// Fixed 6 zones (A to F) as per the tactical map
const FIXED_ZONES = [
  {
    id: 'zone-a',
    name: 'Zone A - Main Stage',
    density: 45,
    predictedDensity: 50,
    status: 'normal'
  },
  {
    id: 'zone-b',
    name: 'Zone B - North Entrance',
    density: 35,
    predictedDensity: 40,
    status: 'normal'
  },
  {
    id: 'zone-c',
    name: 'Zone C - East Wing',
    density: 42,
    predictedDensity: 45,
    status: 'normal'
  },
  {
    id: 'zone-d',
    name: 'Zone D - Food Court',
    density: 55,
    predictedDensity: 60,
    status: 'normal'
  },
  {
    id: 'zone-e',
    name: 'Zone E - VIP Lounge',
    density: 30,
    predictedDensity: 32,
    status: 'normal'
  },
  {
    id: 'zone-f',
    name: 'Zone F - South Exit',
    density: 25,
    predictedDensity: 28,
    status: 'normal'
  }
];

async function addZones() {
  console.log('🚀 Adding 6 fixed zones to Firestore...\n');
  
  try {
    for (const zone of FIXED_ZONES) {
      // Use the zone.id as the document ID
      const zoneRef = doc(db, 'zones', zone.id);
      await setDoc(zoneRef, zone);
      console.log(`✅ Added ${zone.id}: ${zone.name}`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n✨ Successfully added all 6 zones to Firestore!');
    console.log('\n📍 Zones added:');
    console.log('   Zone A - Main Stage');
    console.log('   Zone B - North Entrance');
    console.log('   Zone C - East Wing');
    console.log('   Zone D - Food Court');
    console.log('   Zone E - VIP Lounge');
    console.log('   Zone F - South Exit');
    console.log('\n🔗 View in Firebase Console:');
    console.log('   https://console.firebase.google.com/project/drishti-database/firestore\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding zones:', error);
    process.exit(1);
  }
}

// Run the script
addZones();
