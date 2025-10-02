#!/usr/bin/env node

/**
 * Firebase Firestore Rules Deployment Script
 * Genesis Event Manager
 * 
 * This script helps deploy Firestore security rules and set up initial data
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide service account key file
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your project ID here
    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id'
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message);
  console.log('Make sure to set GOOGLE_APPLICATION_CREDENTIALS or provide service account key');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Create initial admin user
 */
async function createInitialAdmin(email, name) {
  try {
    // Get user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Create admin document
    await db.collection('admins').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: email,
      name: name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    
    console.log(`✅ Created admin user: ${email}`);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User ${email} not found in Firebase Auth. Please create the user first.`);
    } else {
      console.error('Error creating admin user:', error.message);
    }
    throw error;
  }
}

/**
 * Create initial volunteer user
 */
async function createInitialVolunteer(email, name) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    
    await db.collection('volunteers').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: email,
      name: name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      permissions: ['scan_qr', 'view_participants', 'verify_attendance']
    });
    
    console.log(`✅ Created volunteer user: ${email}`);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User ${email} not found in Firebase Auth. Please create the user first.`);
    } else {
      console.error('Error creating volunteer user:', error.message);
    }
    throw error;
  }
}

/**
 * Set up initial system configuration
 */
async function setupSystemConfig() {
  try {
    await db.collection('config').doc('system').set({
      appName: 'Genesis Event Manager',
      version: '1.0.0',
      maintenanceMode: false,
      registrationEnabled: true,
      maxEventsPerUser: 10,
      qrCodeExpiryHours: 24,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ System configuration created');
  } catch (error) {
    console.error('Error setting up system config:', error.message);
    throw error;
  }
}

/**
 * Create sample event (optional)
 */
async function createSampleEvent() {
  try {
    const eventRef = db.collection('events').doc();
    await eventRef.set({
      id: eventRef.id,
      title: 'Genesis Tech Summit 2025',
      description: 'Annual technology summit featuring the latest innovations and networking opportunities.',
      date: '2025-06-15',
      time: '09:00',
      location: 'Convention Center, Main Hall',
      currentParticipants: 0,
      maxParticipants: 500,
      isActive: true,
      entryFee: 1500,
      paymentMethod: 'both',
      upiId: 'genesis@upi',
      isTeamEvent: false,
      teamSize: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Sample event created');
    return eventRef.id;
  } catch (error) {
    console.error('Error creating sample event:', error.message);
    throw error;
  }
}

/**
 * Validate Firestore rules file
 */
function validateRulesFile() {
  const rulesPath = path.join(__dirname, 'firestore.rules');
  
  if (!fs.existsSync(rulesPath)) {
    console.error('❌ firestore.rules file not found');
    return false;
  }
  
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  
  // Basic validation
  if (!rulesContent.includes('rules_version = \'2\'')) {
    console.error('❌ Invalid rules version');
    return false;
  }
  
  if (!rulesContent.includes('service cloud.firestore')) {
    console.error('❌ Invalid rules format');
    return false;
  }
  
  console.log('✅ Firestore rules file validated');
  return true;
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Genesis Event Manager - Firestore Setup');
  console.log('==========================================\n');
  
  try {
    // Validate rules file
    if (!validateRulesFile()) {
      process.exit(1);
    }
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const adminEmail = args[0];
    const adminName = args[1] || 'System Admin';
    const volunteerEmail = args[2];
    const volunteerName = args[3] || 'Volunteer User';
    
    if (!adminEmail) {
      console.error('❌ Please provide admin email as first argument');
      console.log('Usage: node deploy-firestore-rules.js admin@example.com "Admin Name" volunteer@example.com "Volunteer Name"');
      process.exit(1);
    }
    
    console.log('📋 Setting up initial data...\n');
    
    // Create initial admin
    await createInitialAdmin(adminEmail, adminName);
    
    // Create initial volunteer (optional)
    if (volunteerEmail) {
      await createInitialVolunteer(volunteerEmail, volunteerName);
    }
    
    // Setup system configuration
    await setupSystemConfig();
    
    // Create sample event (optional)
    const createSample = process.env.CREATE_SAMPLE_EVENT === 'true';
    if (createSample) {
      await createSampleEvent();
    }
    
    console.log('\n✅ Firestore setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy security rules: firebase deploy --only firestore:rules');
    console.log('2. Test the application with the created admin/volunteer accounts');
    console.log('3. Create additional events through the admin interface');
    console.log('4. Monitor Firebase Console for any security rule violations');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  createInitialAdmin,
  createInitialVolunteer,
  setupSystemConfig,
  createSampleEvent
};
