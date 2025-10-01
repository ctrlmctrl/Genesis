# Firebase Authentication Setup Guide

## ✅ **Firebase Auth is Already Configured!**

Your app now uses **Firebase Authentication** with Google sign-in instead of the mock authentication.

## 🔧 **Setup Steps**

### 1. Enable Google Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/genesis-8ca86)
2. Click **"Authentication"** in the left sidebar
3. Click **"Get started"** (if not already enabled)
4. Go to **"Sign-in method"** tab
5. Click **"Google"** provider
6. Toggle **"Enable"**
7. Set **Project support email** to your email
8. Click **"Save"**

### 2. Configure OAuth Consent Screen (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **genesis-8ca86**
3. Go to **"APIs & Services"** → **"OAuth consent screen"**
4. Fill in the required information:
   - **App name**: Genesis Event Manager
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click **"Save and Continue"**
6. Add your domain to **"Authorized domains"** if needed

### 3. Your App is Ready!

The following files are already configured:
- ✅ `src/firebase.ts` - Firebase initialization with Auth
- ✅ `src/services/googleAuth.ts` - Firebase Auth integration
- ✅ `src/contexts/AuthContext.tsx` - Updated to use Firebase Auth

## 🚀 **What's New**

### **Real Google Authentication:**
- ✅ **Actual Google sign-in** (no more mock users)
- ✅ **Secure authentication** through Firebase
- ✅ **Persistent login** across browser sessions
- ✅ **Automatic token management**

### **Features:**
- ✅ **Google popup sign-in** - Opens Google's official sign-in popup
- ✅ **User profile data** - Real name, email, profile picture
- ✅ **Secure logout** - Properly clears authentication
- ✅ **Auto-login** - Remembers users across sessions

## 🎯 **How It Works**

1. **User clicks "Sign in with Google"**
2. **Google popup opens** with official Google sign-in
3. **User selects account** and grants permissions
4. **Firebase handles authentication** and returns user data
5. **User is logged in** and can access the app
6. **Session persists** until user logs out

## 🔒 **Security Benefits**

- ✅ **No mock authentication** - Real Google OAuth
- ✅ **Secure tokens** - Firebase manages JWT tokens
- ✅ **HTTPS only** - Secure communication
- ✅ **Google's security** - Benefits from Google's security measures

## 🧪 **Testing**

1. **Start your app**: `npm start`
2. **Click "Sign in with Google"**
3. **Google popup should open**
4. **Select your Google account**
5. **You should be logged in** with your real Google profile

## 🚨 **Troubleshooting**

### **If Google popup doesn't open:**
- Check if Google Auth is enabled in Firebase Console
- Verify your domain is authorized
- Check browser console for errors

### **If sign-in fails:**
- Make sure OAuth consent screen is configured
- Check if your email is added to test users (if in testing mode)
- Verify Firebase project settings

### **If user data is missing:**
- Check if required scopes are added (email, profile)
- Verify Google account has the required information

## 🎉 **You're All Set!**

Your app now has **real Google authentication** through Firebase! Users can sign in with their actual Google accounts and their data will be securely managed by Firebase.

## 📱 **Next Steps**

1. **Test the authentication** in your app
2. **Deploy to production** when ready
3. **Add more authentication providers** if needed (Facebook, Twitter, etc.)
4. **Implement role-based access** using Firebase Auth custom claims
