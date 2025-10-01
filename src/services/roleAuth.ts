// Role-based authentication for volunteers and admins
export interface RoleUser {
  id: string;
  username: string;
  role: 'volunteer' | 'admin';
  name: string;
  email: string;
}

// Predefined credentials for volunteers and admins
const ROLE_CREDENTIALS = {
  volunteer: {
    username: 'volunteer',
    password: 'volunteer123',
    user: {
      id: 'vol-001',
      username: 'volunteer',
      role: 'volunteer' as const,
      name: 'Event Volunteer',
      email: 'volunteer@genesis.com'
    }
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    user: {
      id: 'admin-001',
      username: 'admin',
      role: 'admin' as const,
      name: 'Event Administrator',
      email: 'admin@genesis.com'
    }
  }
};

class RoleAuthService {
  private currentUser: RoleUser | null = null;

  async login(username: string, password: string): Promise<RoleUser> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check credentials
    if (username === ROLE_CREDENTIALS.volunteer.username && password === ROLE_CREDENTIALS.volunteer.password) {
      this.currentUser = ROLE_CREDENTIALS.volunteer.user;
      localStorage.setItem('roleUser', JSON.stringify(this.currentUser));
      return this.currentUser;
    }

    if (username === ROLE_CREDENTIALS.admin.username && password === ROLE_CREDENTIALS.admin.password) {
      this.currentUser = ROLE_CREDENTIALS.admin.user;
      localStorage.setItem('roleUser', JSON.stringify(this.currentUser));
      return this.currentUser;
    }

    throw new Error('Invalid username or password');
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('roleUser');
  }

  getCurrentUser(): RoleUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Check localStorage
    const savedUser = localStorage.getItem('roleUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        return this.currentUser;
      } catch (error) {
        console.warn('Error parsing saved role user data');
        localStorage.removeItem('roleUser');
        return null;
      }
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(role: 'volunteer' | 'admin'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}

export const roleAuthService = new RoleAuthService();
