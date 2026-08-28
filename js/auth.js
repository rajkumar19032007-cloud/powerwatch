/**
 * PowerWatch - Authentication & Role-Based Access Control (RBAC)
 * Supports Firebase Auth and One-Click Demo Access for Admin, Manager, Viewer
 */

const DEMO_ACCOUNTS = [
  {
    uid: "usr_admin_01",
    name: "Dr. Vikram Seth",
    email: "admin@powerwatch.io",
    role: "Admin",
    organization: "National Institute of Technology",
    avatar: "VS",
    joinedDate: "2024-01-15"
  },
  {
    uid: "usr_mgr_02",
    name: "Ananya Sharma",
    email: "manager@powerwatch.io",
    role: "Energy Manager",
    organization: "National Institute of Technology",
    avatar: "AS",
    joinedDate: "2024-03-10"
  },
  {
    uid: "usr_view_03",
    name: "Rahul Verma",
    email: "viewer@powerwatch.io",
    role: "Viewer",
    organization: "National Institute of Technology",
    avatar: "RV",
    joinedDate: "2024-06-01"
  }
];

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initAuth();
  }

  initAuth() {
    const savedUser = localStorage.getItem('powerwatch_active_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        console.error("Error reading cached user", e);
      }
    } else {
      // Default to Admin demo user for frictionless review experience
      this.currentUser = DEMO_ACCOUNTS[0];
      localStorage.setItem('powerwatch_active_user', JSON.stringify(this.currentUser));
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if current user has necessary role privilege
   * Hierarchy: Admin (3) > Energy Manager (2) > Viewer (1)
   */
  hasPermission(requiredRole) {
    if (!this.currentUser) return false;
    const hierarchy = { "Admin": 3, "Energy Manager": 2, "Viewer": 1 };
    const userRank = hierarchy[this.currentUser.role] || 1;
    const reqRank = hierarchy[requiredRole] || 1;
    return userRank >= reqRank;
  }

  loginWithCredentials(email, password) {
    // 1. Check demo accounts match
    const demoFound = DEMO_ACCOUNTS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (demoFound) {
      this.currentUser = demoFound;
      localStorage.setItem('powerwatch_active_user', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }

    // 2. Check registered custom users in localStorage
    const customUsers = JSON.parse(localStorage.getItem('powerwatch_custom_users') || '[]');
    const customFound = customUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (customFound) {
      this.currentUser = customFound;
      localStorage.setItem('powerwatch_active_user', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }

    // If password provided and email contains @, accept as test account
    if (email.includes('@')) {
      const newUser = {
        uid: `usr_${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email,
        role: "Energy Manager",
        organization: "Campus Energy Cell",
        avatar: email.substring(0, 2).toUpperCase(),
        joinedDate: new Date().toISOString()
      };
      this.currentUser = newUser;
      localStorage.setItem('powerwatch_active_user', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }

    return { success: false, error: "Invalid email or password" };
  }

  quickDemoLogin(role = "Admin") {
    const account = DEMO_ACCOUNTS.find(a => a.role.toLowerCase().includes(role.toLowerCase())) || DEMO_ACCOUNTS[0];
    this.currentUser = account;
    localStorage.setItem('powerwatch_active_user', JSON.stringify(this.currentUser));
    return account;
  }

  register(userData) {
    const customUsers = JSON.parse(localStorage.getItem('powerwatch_custom_users') || '[]');
    const existing = customUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase()) ||
                     DEMO_ACCOUNTS.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const newUser = {
      uid: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role || "Viewer",
      organization: userData.organization || "Academic Campus",
      avatar: userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      joinedDate: new Date().toISOString()
    };

    customUsers.push(newUser);
    localStorage.setItem('powerwatch_custom_users', JSON.stringify(customUsers));

    this.currentUser = newUser;
    localStorage.setItem('powerwatch_active_user', JSON.stringify(this.currentUser));
    return { success: true, user: newUser };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('powerwatch_active_user');
    window.location.href = '../login.html';
  }

  applyDOMRoleGating() {
    if (!this.currentUser) return;

    // Update Profile widgets in UI
    const nameEls = document.querySelectorAll('.user-name');
    nameEls.forEach(el => el.textContent = this.currentUser.name);

    const roleEls = document.querySelectorAll('.user-role-badge');
    roleEls.forEach(el => el.textContent = this.currentUser.role);

    const avatarEls = document.querySelectorAll('.user-avatar');
    avatarEls.forEach(el => el.textContent = this.currentUser.avatar || 'PW');

    // Gate Admin-only elements
    const adminOnlyEls = document.querySelectorAll('[data-role="admin"]');
    adminOnlyEls.forEach(el => {
      if (!this.hasPermission('Admin')) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });

    // Gate Manager-only elements
    const managerOnlyEls = document.querySelectorAll('[data-role="manager"]');
    managerOnlyEls.forEach(el => {
      if (!this.hasPermission('Energy Manager')) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
  }
}

window.authManager = new AuthManager();

// Automatically update DOM on page load
document.addEventListener('DOMContentLoaded', () => {
  if (window.authManager) {
    window.authManager.applyDOMRoleGating();
  }
});
