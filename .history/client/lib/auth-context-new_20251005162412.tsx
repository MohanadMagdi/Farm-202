import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserRole } from '@shared/types';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock user data - replace with API calls to your backend
const mockUsers: Record<string, { user: User; password: string }> = {
  'admin@farm.com': {
    password: 'admin123',
    user: {
      id: 'user_001',
      email: 'admin@farm.com',
      displayName: 'أحمد محمد - مدير المزرعة',
      role: 'owner',
      permissions: ['all']
    }
  },
  'manager@farm.com': {
    password: 'manager123',
    user: {
      id: 'user_002',
      email: 'manager@farm.com',
      displayName: 'محمد علي - مدير العمليات',
      role: 'manager',
      permissions: [
        'animals:read', 'animals:write',
        'barns:read', 'barns:write',
        'feeding:read', 'feeding:write',
        'health:read', 'health:write',
        'warehouse:read'
      ]
    }
  },
  'vet@farm.com': {
    password: 'vet123',
    user: {
      id: 'user_003',
      email: 'vet@farm.com',
      displayName: 'د. سارة أحمد - طبيب بيطري',
      role: 'veterinarian',
      permissions: [
        'animals:read',
        'health:read', 'health:write',
        'reports:read'
      ]
    }
  },
  'worker@farm.com': {
    password: 'worker123',
    user: {
      id: 'user_004',
      email: 'worker@farm.com',
      displayName: 'خالد محمود - عامل',
      role: 'worker',
      permissions: [
        'animals:read',
        'feeding:read', 'feeding:write',
        'barns:read'
      ]
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('farm_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('farm_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userRecord = mockUsers[email];
      
      if (!userRecord || userRecord.password !== password) {
        throw new Error('بيانات الدخول غير صحيحة');
      }

      setUser(userRecord.user);
      localStorage.setItem('farm_user', JSON.stringify(userRecord.user));
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOutHandler = async () => {
    setUser(null);
    localStorage.removeItem('farm_user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut: signOutHandler,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export for backward compatibility
export type { User };
