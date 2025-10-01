# Firebase Setup Guide

## ✅ Your Firebase Configuration is Ready!

Your Firebase project is already configured with the following details:
- **Project ID**: genesis-8ca86
- **Auth Domain**: genesis-8ca86.firebaseapp.com
- **Storage Bucket**: genesis-8ca86.firebasestorage.app

## 🔧 Setup Steps

### 1. Enable Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **genesis-8ca86**
3. In the left sidebar, click **"Firestore Database"**
4. Click **"Create database"**
5. Choose **"Start in test mode"** (for development)
6. Select a location (choose the closest to your users)
7. Click **"Done"**

### 2. Set Up Firestore Security Rules (Important!)
In the Firestore Database section:
1. Go to **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (for development)
    // In production, implement proper authentication rules
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

### 3. Your App is Already Configured!
The following files are already set up:
- ✅ `src/firebase.ts` - Firebase initialization
- ✅ `src/services/firebaseService.ts` - Database operations
- ✅ `src/services/storageConfig.ts` - Set to use Firebase

### 4. Test the Setup
1. Start your development server: `npm start`
2. Create an event in the admin panel
3. Check your Firebase Console > Firestore Database
4. You should see collections: `events`, `participants`, `verification_records`

## 🚀 What's Working Now

With Firebase enabled, your app now has:
- ✅ **Cloud Database** - Data persists across devices and sessions
- ✅ **Real-time Updates** - Changes sync instantly
- ✅ **Scalable Storage** - No storage limits
- ✅ **Backup & Recovery** - Automatic data backup
- ✅ **Multi-device Access** - Access from any device

## 🔒 Security Notes

**Current Setup**: Open access (for development)
**For Production**: Implement proper authentication rules

Example production rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Authenticated write
    }
    
    match /participants/{participantId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎯 Next Steps

1. **Test the app** - Create events and register participants
2. **Check Firebase Console** - Verify data is being saved
3. **Deploy to production** - When ready, update security rules
4. **Monitor usage** - Use Firebase Analytics to track app usage

## 📱 Access Your Data

- **Firebase Console**: https://console.firebase.google.com/project/genesis-8ca86
- **Firestore Database**: https://console.firebase.google.com/project/genesis-8ca86/firestore

Your app is now using Firebase for persistent data storage! 🎉
