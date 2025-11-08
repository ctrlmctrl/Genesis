// Role-based authentication for volunteers and admins
export interface RoleUser {
  id: string;
  username: string;
  role: 'volunteer' | 'admin';
  name: string;
  email: string;
}

// Predefined user IDs for volunteers and admins
const ROLE_USERS = {
  volunteer: {
    id: 'vol-001',
    username: '0923',
    role: 'volunteer' as const,
    name: 'Event Volunteer',
    email: 'volunteer@genesis.com'
  },
  admin: {
    id: 'admin-001',
    username: '59',
    role: 'admin' as const,
    name: 'Event Administrator',
    email: 'admin@genesis.com'
  }
};

class RoleAuthService {
  private currentUser: RoleUser | null = null;

  async login(userId: string): Promise<RoleUser> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check user ID
    if (userId === ROLE_USERS.volunteer.username) {
      this.currentUser = ROLE_USERS.volunteer;
      localStorage.setItem('roleUser', JSON.stringify(this.currentUser));
      return this.currentUser;
    }

    if (userId === ROLE_USERS.admin.username) {
      this.currentUser = ROLE_USERS.admin;
      localStorage.setItem('roleUser', JSON.stringify(this.currentUser));
      return this.currentUser;
    }

    throw new Error('Invalid User ID');
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
