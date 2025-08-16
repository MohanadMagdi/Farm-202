import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
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
  firebaseUser: FirebaseUser | null;
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

// Mock user data - in a real app, this would come from Firestore
const mockUsers: Record<string, User> = {
  'admin@farm.com': {
    id: 'user_001',
    email: 'admin@farm.com',
    displayName: 'أحمد محمد - مدير المزرعة',
    role: 'owner',
    permissions: ['all']
  },
  'manager@farm.com': {
    id: 'user_002',
    email: 'manager@farm.com',
    displayName: 'فاطمة علي - مديرة العمليات',
    role: 'manager',
    permissions: ['animals', 'barns', 'feeding', 'inventory', 'reports']
  },
  'vet@farm.com': {
    id: 'user_003',
    email: 'vet@farm.com',
    displayName: 'د. محمود البيطري',
    role: 'vet',
    permissions: ['animals', 'health', 'reports']
  },
  'inventory@farm.com': {
    id: 'user_004',
    email: 'inventory@farm.com',
    displayName: 'سارة أحمد - مسؤولة المخزون',
    role: 'inventory',
    permissions: ['inventory', 'feeding', 'reports']
  }
};

// Role-based permissions
const rolePermissions: Record<UserRole, string[]> = {
  owner: ['all'],
  manager: ['animals', 'barns', 'feeding', 'inventory', 'reports', 'users'],
  vet: ['animals', 'health', 'reports'],
  inventory: ['inventory', 'feeding', 'reports'],
  barn_manager: ['animals', 'barns', 'feeding', 'reports'],
  accountant: ['reports', 'inventory'],
  sales: ['animals', 'reports']
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In development mode, skip Firebase auth listener
    if (import.meta.env.DEV) {
      setLoading(false);
      return () => {};
    }

    // In production, use Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // In production, map Firebase users to mock users
        const mockUser = mockUsers[firebaseUser.email || ''];
        if (mockUser) {
          setUser(mockUser);
        } else {
          // Default user for unknown emails
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'مستخدم',
            role: 'barn_manager',
            permissions: rolePermissions.barn_manager
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    // Use mock authentication in development mode
    if (import.meta.env.DEV) {
      const mockUser = mockUsers[email];
      if (mockUser && password === 'demo123') {
        setUser(mockUser);
        setFirebaseUser({
          uid: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName
        } as FirebaseUser);
        return;
      }
      throw new Error('بيانات تسجيل الدخول غير صحيحة');
    }

    // Use Firebase authentication in production
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      // In development mode, just clear the state
      if (import.meta.env.DEV) {
        setUser(null);
        setFirebaseUser(null);
        return;
      }

      // In production, use Firebase signOut
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signOut: signOutUser,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
