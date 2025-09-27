// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';

// Mock Google API for development
const mockGoogleAPI = {
  load: (api: string, callback: () => void) => {
    setTimeout(callback, 100);
  },
  auth2: {
    init: (config: any) => Promise.resolve({
      isSignedIn: {
        get: () => false
      },
      currentUser: {
        get: () => ({
          getBasicProfile: () => ({
            getId: () => 'mock-id',
            getName: () => 'Mock User',
            getEmail: () => 'mock@example.com',
            getImageUrl: () => 'https://via.placeholder.com/150'
          })
        })
      },
      signIn: () => Promise.resolve({
        getBasicProfile: () => ({
          getId: () => 'mock-id',
          getName: () => 'Mock User',
          getEmail: () => 'mock@example.com',
          getImageUrl: () => 'https://via.placeholder.com/150'
        })
      }),
      signOut: () => Promise.resolve()
    })
  }
};

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

class GoogleAuthService {
  private isGoogleLoaded = false;

  async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isGoogleLoaded) {
        resolve();
        return;
      }

      // Use mock API for development
      if (GOOGLE_CLIENT_ID === 'your-google-client-id') {
        window.gapi = mockGoogleAPI as any;
        this.isGoogleLoaded = true;
        resolve();
        return;
      }

      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        // Load Google Auth library
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: GOOGLE_CLIENT_ID,
          }).then(() => {
            this.isGoogleLoaded = true;
            resolve();
          }).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isGoogleLoaded) {
      await this.initializeGoogleAuth();
    }

    return new Promise((resolve, reject) => {
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      authInstance.signIn().then((googleUser: any) => {
        const profile = googleUser.getBasicProfile();
        const user: GoogleUser = {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          picture: profile.getImageUrl(),
        };
        resolve(user);
      }).catch(reject);
    });
  }

  async signOut(): Promise<void> {
    if (!this.isGoogleLoaded) {
      return;
    }

    const authInstance = window.gapi.auth2.getAuthInstance();
    return authInstance.signOut();
  }

  isSignedIn(): boolean {
    if (!this.isGoogleLoaded) {
      return false;
    }

    const authInstance = window.gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  }

  getCurrentUser(): GoogleUser | null {
    if (!this.isGoogleLoaded || !this.isSignedIn()) {
      return null;
    }

    const authInstance = window.gapi.auth2.getAuthInstance();
    const googleUser = authInstance.currentUser.get();
    const profile = googleUser.getBasicProfile();

    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      picture: profile.getImageUrl(),
    };
  }
}

export const googleAuthService = new GoogleAuthService();

// Extend Window interface for Google API
declare global {
  interface Window {
    gapi: any;
  }
}
