# Firebase Authentication Troubleshooting Guide

## Common Google Sign-In Issues

### Issue: Popup closes automatically / "Failed to login"

This usually happens due to one of these reasons:

### 1. **Authorized Domains Not Configured**

**Solution:** Add your domain to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `genesis-8ca86`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add these domains:
   - `localhost` (for development)
   - `127.0.0.1` (for development)
   - `your-production-domain.com` (for production)
   - `genesis-8ca86.firebaseapp.com` (Firebase hosting)

### 2. **Google OAuth Client Configuration**

**Check Google Cloud Console:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `genesis-8ca86`
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Add authorized origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
   - `https://genesis-8ca86.firebaseapp.com` (Firebase hosting)

### 3. **Browser Issues**

**Common fixes:**
- Clear browser cache and cookies
- Disable popup blockers
- Try incognito/private mode
- Try different browser
- Check browser console for errors

### 4. **Network/Firewall Issues**

**Check if blocked:**
- Corporate firewall blocking Google APIs
- Antivirus blocking popups
- Network restrictions

## Testing Steps

### 1. **Test in Browser Console**

Open browser console and run:
```javascript
// Check if Firebase is loaded
console.log('Firebase Auth:', window.firebase?.auth);

// Check current auth state
firebase.auth().onAuthStateChanged((user) => {
  console.log('Auth state:', user);
});
```

### 2. **Test Manual Sign-In**

```javascript
// Manual test in console
const provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider)
  .then((result) => {
    console.log('Success:', result.user);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
```

### 3. **Check Network Tab**

1. Open Developer Tools → Network
2. Try to sign in
3. Look for failed requests to:
   - `accounts.google.com`
   - `firebase.googleapis.com`
   - `identitytoolkit.googleapis.com`

## Configuration Checklist

### Firebase Console Settings

- [ ] **Authentication enabled**
- [ ] **Google provider enabled**
- [ ] **Authorized domains added**
- [ ] **Web SDK configuration correct**

### Google Cloud Console Settings

- [ ] **OAuth consent screen configured**
- [ ] **Authorized JavaScript origins added**
- [ ] **Authorized redirect URIs added**

### Code Configuration

- [ ] **Firebase config correct in `src/firebase.ts`**
- [ ] **Auth service properly initialized**
- [ ] **Error handling implemented**

## Quick Fixes

### Fix 1: Update Firebase Config

Make sure your `src/firebase.ts` has the correct config:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCoZzsijw4Br7uIZzyX-rCTWndGeXQOJ00",
  authDomain: "genesis-8ca86.firebaseapp.com",
  projectId: "genesis-8ca86",
  storageBucket: "genesis-8ca86.firebasestorage.app",
  messagingSenderId: "47380732193",
  appId: "1:47380732193:web:5aabe37ca1edf4ba680660"
};
```

### Fix 2: Add Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains:
- Add `localhost`
- Add your production domain

### Fix 3: Test with Redirect Instead of Popup

If popup continues to fail, try redirect method:

```typescript
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';

// Use redirect instead of popup
await signInWithRedirect(auth, provider);

// Handle redirect result
useEffect(() => {
  getRedirectResult(auth).then((result) => {
    if (result) {
      // User signed in
      console.log('User:', result.user);
    }
  }).catch((error) => {
    console.error('Redirect error:', error);
  });
}, []);
```

## Error Codes Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/popup-blocked` | Browser blocked popup | Allow popups for your site |
| `auth/popup-closed-by-user` | User closed popup | User action, retry |
| `auth/cancelled-popup-request` | Multiple popups | Wait and retry |
| `auth/network-request-failed` | Network issue | Check internet connection |
| `auth/invalid-api-key` | Wrong API key | Check Firebase config |
| `auth/unauthorized-domain` | Domain not authorized | Add domain to Firebase |

## Development vs Production

### Development (localhost:3000)
- Use `http://localhost:3000` in authorized origins
- Enable `localhost` in Firebase authorized domains

### Production
- Use your actual domain (e.g., `https://yourdomain.com`)
- Add production domain to both Firebase and Google Cloud Console

## Still Having Issues?

1. **Check Firebase Console Logs:**
   - Go to Firebase Console → Authentication → Users
   - Check if any sign-in attempts are logged

2. **Enable Debug Mode:**
   ```typescript
   // Add to your Firebase config
   import { connectAuthEmulator } from 'firebase/auth';
   
   if (process.env.NODE_ENV === 'development') {
     connectAuthEmulator(auth, 'http://localhost:9099');
   }
   ```

3. **Contact Support:**
   - Firebase Support
   - Google Cloud Support
   - Check Firebase Status Page

## Alternative Solutions

If Google Sign-In continues to fail:

1. **Use Firebase Auth UI:**
   ```bash
   npm install firebaseui
   ```

2. **Use Email/Password Authentication:**
   - Enable Email/Password in Firebase Console
   - Implement email verification

3. **Use Other Providers:**
   - Facebook Login
   - GitHub Login
   - Microsoft Login

Remember: The most common issue is unauthorized domains. Make sure to add your domain to Firebase Console!
