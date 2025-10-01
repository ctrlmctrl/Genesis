// Remove User import since we're using GoogleUser interface
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';

// Google OAuth configuration (using Firebase Auth, so client ID is handled by Firebase)
// const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '848218204703-qb849bqu9nht5var8h8aqkhgmpee0k72.apps.googleusercontent.com';

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

class GoogleAuthService {
  private signedIn = false;
  private currentUser: GoogleUser | null = null;
  private authStateUnsubscribe: (() => void) | null = null;

  async initializeGoogleAuth(): Promise<void> {
    // Listen for authentication state changes
    this.authStateUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        this.currentUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Unknown User',
          email: firebaseUser.email || '',
          picture: firebaseUser.photoURL || 'https://via.placeholder.com/150',
        };
        this.signedIn = true;
        
        // Save to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(this.currentUser));
      } else {
        this.currentUser = null;
        this.signedIn = false;
        localStorage.removeItem('user');
      }
    });

    // Check if user is already signed in from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.signedIn = true;
      } catch (error) {
        console.warn('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }

  async signIn(): Promise<GoogleUser> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      const user: GoogleUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Unknown User',
        email: firebaseUser.email || '',
        picture: firebaseUser.photoURL || 'https://via.placeholder.com/150',
      };
      
      this.signedIn = true;
      this.currentUser = user;
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw new Error('Failed to sign in with Google');
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      this.signedIn = false;
      this.currentUser = null;
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  getCurrentUser(): GoogleUser | null {
    return this.currentUser;
  }

  isSignedIn(): boolean {
    return this.signedIn;
  }

  // Cleanup method
  cleanup(): void {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
    }
  }
}

export const googleAuthService = new GoogleAuthService();