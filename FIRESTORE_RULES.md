# Firestore Security Rules

## For Development (Open Access)
Copy and paste this into your Firestore Rules tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## For Production (Secure Rules)
If you want more secure rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events - public read, authenticated write
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Participants - authenticated read/write only
    match /participants/{participantId} {
      allow read, write: if request.auth != null;
    }
    
    // Verification records - authenticated read/write only
    match /verification_records/{recordId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step-by-Step Setup:

1. Go to [Firebase Console](https://console.firebase.google.com/project/genesis-8ca86)
2. Click **"Firestore Database"** in the left sidebar
3. Click the **"Rules"** tab
4. Delete all existing content
5. Copy and paste the **Development rules** above
6. Click **"Publish"**

## Important Notes:

- **Development rules** allow anyone to read/write (good for testing)
- **Production rules** require authentication (secure for live apps)
- Always test your rules in the Firebase Console simulator first
- Make sure there are no extra spaces or characters when copying

## Testing Your Rules:

1. In the Rules tab, click **"Simulator"**
2. Try different operations to test if they work
3. Check for any errors in the simulator
