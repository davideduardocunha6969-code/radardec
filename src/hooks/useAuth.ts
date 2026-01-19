import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
}

interface UserPermissions {
  isAdmin: boolean;
  allowedPages: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({ isAdmin: false, allowedPages: [] });
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const isAdmin = roleData?.role === 'admin';

      // Fetch permissions
      const { data: permData } = await supabase
        .from('user_permissions')
        .select('page_key')
        .eq('user_id', userId);

      const allowedPages = permData?.map(p => p.page_key) || [];

      setPermissions({ isAdmin, allowedPages });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => fetchUserData(currentSession.user.id), 0);
        } else {
          setProfile(null);
          setPermissions({ isAdmin: false, allowedPages: [] });
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchUserData(existingSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPermissions({ isAdmin: false, allowedPages: [] });
  };

  const hasPageAccess = (pageKey: string): boolean => {
    if (permissions.isAdmin) return true;
    return permissions.allowedPages.includes(pageKey);
  };

  return {
    user,
    session,
    profile,
    permissions,
    loading,
    signIn,
    signOut,
    hasPageAccess,
    isAdmin: permissions.isAdmin,
  };
}
