import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
}

interface UserPermissions {
  isAdmin: boolean;
  isMarketingManager: boolean;
  allowedPages: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  permissions: UserPermissions;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPageAccess: (pageKey: string) => boolean;
  canValidateContent: () => boolean;
  isAdmin: boolean;
  isMarketingManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  permissions: { isAdmin: false, isMarketingManager: false, allowedPages: [] },
  loading: true,
  signIn: async () => ({ error: new Error('AuthProvider not ready') }),
  signOut: async () => {},
  hasPageAccess: () => false,
  canValidateContent: () => false,
  isAdmin: false,
  isMarketingManager: false,
};

export function useAuthContext() {
  const context = useContext(AuthContext);
  return context ?? defaultAuthContext;
}
