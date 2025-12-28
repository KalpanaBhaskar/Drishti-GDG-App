/**
 * Firebase Setup Verification Script
 * 
 * This script checks if your Firebase configuration is correct
 * Run with: npm run check-firebase
 */

import * as fs from 'fs';
import * as path from 'path';

async function checkFirebaseSetup() {
  console.log('🔍 Checking Firebase Setup...\n');

  // Check .env.local file
  console.log('📋 Checking .env.local file:');
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env.local file not found!');
    console.log('   Please create .env.local in the project root.\n');
    process.exit(1);
  }
  
  console.log('   ✅ .env.local file exists\n');

  // Read and parse .env.local
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  console.log('🔑 Environment Variables Status:');
  let allVarsSet = true;
  const envVars: Record<string, string> = {};

  for (const varName of requiredVars) {
    const regex = new RegExp(`${varName}\\s*=\\s*["']?([^"'\\n]+)["']?`);
    const match = envContent.match(regex);
    
    if (!match || !match[1] || match[1].includes('your_') || match[1].includes('YOUR_')) {
      console.log(`   ❌ ${varName}: Not configured or using placeholder`);
      allVarsSet = false;
    } else {
      const value = match[1].trim();
      envVars[varName] = value;
      const maskedValue = value.length > 20 
        ? value.substring(0, 15) + '...' + value.substring(value.length - 4)
        : value.substring(0, 10) + '...';
      console.log(`   ✅ ${varName}: ${maskedValue}`);
    }
  }

  if (!allVarsSet) {
    console.log('\n❌ Some Firebase environment variables are not properly configured.');
    console.log('   Please update your .env.local file with actual Firebase credentials.');
    console.log('   See FIREBASE_SETUP.md for detailed instructions.\n');
    process.exit(1);
  }

  console.log('\n✅ All environment variables are configured!\n');
  
  // Display project info
  if (envVars['VITE_FIREBASE_PROJECT_ID']) {
    console.log('📊 Your Firebase Project:');
    console.log(`   Project ID: ${envVars['VITE_FIREBASE_PROJECT_ID']}`);
    console.log(`   Auth Domain: ${envVars['VITE_FIREBASE_AUTH_DOMAIN']}`);
    console.log(`   Console URL: https://console.firebase.google.com/project/${envVars['VITE_FIREBASE_PROJECT_ID']}\n`);
  }

  console.log('✅ Firebase Configuration Verification Complete!\n');
  
  console.log('📝 Next Steps to Test:');
  console.log('   1. Start your app: npm run dev');
  console.log('   2. Open http://localhost:5173');
  console.log('   3. The app will automatically connect to Firestore');
  console.log('   4. Click "Admin Login" to test authentication');
  console.log('   5. Or run: npm run seed-db (to initialize sample data)\n');
  
  console.log('🌐 View Your Data:');
  console.log(`   Firebase Console: https://console.firebase.google.com/project/${envVars['VITE_FIREBASE_PROJECT_ID']}`);
  console.log(`   Firestore: https://console.firebase.google.com/project/${envVars['VITE_FIREBASE_PROJECT_ID']}/firestore`);
  console.log(`   Authentication: https://console.firebase.google.com/project/${envVars['VITE_FIREBASE_PROJECT_ID']}/authentication/users\n`);
  
  console.log('💡 Quick Test:');
  console.log('   After running your app, check the Firebase Console to see:');
  console.log('   - Zones data (updates every 5 seconds)');
  console.log('   - User authentication logs');
  console.log('   - Any announcements or incidents you create\n');

  process.exit(0);
}

checkFirebaseSetup().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
