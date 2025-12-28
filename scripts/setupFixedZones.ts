/**
 * Fixed Zone Setup Script for Drishti
 * 
 * This script removes all existing zones and sets up the 6 fixed zones (A-F)
 * as per the tactical map. AI analysis can only update features (density, status)
 * but not zone structure.
 * 
 * Run with: npm run setup-zones
 */

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { saveZones } from '../services/firestoreService';

// Fixed 6 zones (A to F) as per the tactical map layout
const FIXED_ZONES = [
  {
    id: 'zone-a',
    name: 'Zone A - Main Stage',
    density: 45,
    predictedDensity: 50,
    status: 'normal' as const
  },
  {
    id: 'zone-b',
    name: 'Zone B - North Entrance',
    density: 35,
    predictedDensity: 40,
    status: 'normal' as const
  },
  {
    id: 'zone-c',
    name: 'Zone C - East Wing',
    density: 42,
    predictedDensity: 45,
    status: 'normal' as const
  },
  {
    id: 'zone-d',
    name: 'Zone D - Food Court',
    density: 55,
    predictedDensity: 60,
    status: 'normal' as const
  },
  {
    id: 'zone-e',
    name: 'Zone E - VIP Lounge',
    density: 30,
    predictedDensity: 32,
    status: 'normal' as const
  },
  {
    id: 'zone-f',
    name: 'Zone F - South Exit',
    density: 25,
    predictedDensity: 28,
    status: 'normal' as const
  }
];

async function deleteAllZones() {
  console.log('🗑️  Deleting all existing zones...');
  
  try {
    const zonesSnapshot = await getDocs(collection(db, 'zones'));
    const batch = writeBatch(db);
    
    let count = 0;
    zonesSnapshot.forEach((docSnap) => {
      batch.delete(doc(db, 'zones', docSnap.id));
      count++;
    });
    
    await batch.commit();
    console.log(`✅ Deleted ${count} existing zones`);
  } catch (error) {
    console.error('❌ Error deleting zones:', error);
    throw error;
  }
}

async function setupFixedZones() {
  console.log('📍 Setting up fixed zones A to F...');
  
  try {
    // Add zones one at a time to avoid quota issues
    for (const zone of FIXED_ZONES) {
      await saveZones([zone]);
      console.log(`   ✓ Created ${zone.id}: ${zone.name}`);
      // Small delay to avoid quota limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('✅ Successfully created all 6 fixed zones');
  } catch (error) {
    console.error('❌ Error creating zones:', error);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 Starting Fixed Zone Setup...\n');
  
  try {
    // Step 1: Delete all existing zones
    await deleteAllZones();
    
    console.log('\n');
    
    // Step 2: Create the 6 fixed zones
    await setupFixedZones();
    
    console.log('\n✨ Zone setup complete! Your database now has exactly 6 fixed zones (A-F).');
    console.log('💡 Note: AI can only update density and status, not create/delete zones.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
