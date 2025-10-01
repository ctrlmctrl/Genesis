# Data Storage Setup Guide

## Current Status
Your application currently uses **in-memory storage**, which means data is lost when the page is refreshed.

## Storage Options

### Option 1: Local Storage (Easiest - No Setup Required)
**Pros:** 
- No external dependencies
- Works offline
- Data persists across browser sessions

**Cons:**
- Data only available on the same device/browser
- Limited storage space (~5-10MB)

**Setup:**
1. Change `STORAGE_TYPE` to `'localStorage'` in `src/services/storageConfig.ts`
2. No additional setup required!

### Option 2: Firebase (Recommended for Production)
**Pros:**
- Cloud database
- Real-time updates
- Scalable
- Authentication built-in

**Cons:**
- Requires Google account
- Internet connection required

**Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Get your config from Project Settings > General > Your apps
5. Create `.env` file in your project root:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```
6. Change `STORAGE_TYPE` to `'firebase'` in `src/services/storageConfig.ts`

### Option 3: JSON Server (Development)
**Pros:**
- Easy to set up
- Good for development/testing
- RESTful API

**Cons:**
- Not suitable for production
- Requires separate server

**Setup:**
1. Install JSON Server: `npm install -g json-server`
2. Create `db.json` file in your project root:
```json
{
  "events": [],
  "participants": [],
  "verification_records": []
}
```
3. Start JSON Server: `json-server --watch db.json --port 3001`
4. Change `STORAGE_TYPE` to `'jsonServer'` in `src/services/storageConfig.ts`

### Option 4: Keep Current (Memory Storage)
**Pros:**
- No setup required
- Fast

**Cons:**
- Data lost on refresh
- Not suitable for production

**Setup:**
- No setup required (current state)

## Quick Start (Recommended)

For immediate persistent storage, use **Local Storage**:

1. Open `src/services/storageConfig.ts`
2. Change line 8: `export const STORAGE_TYPE: StorageType = 'localStorage';`
3. Restart your development server
4. Your data will now persist across browser sessions!

## Migration

To migrate existing data:
1. Export current data using the admin panel
2. Switch to new storage method
3. Import the data back

## Production Recommendation

For production use, I recommend **Firebase** as it provides:
- Cloud storage
- Real-time updates
- User authentication
- Scalability
- Backup and recovery
