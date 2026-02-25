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
  isMarketingManager: boolean;
  allowedPages: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({ isAdmin: false, isMarketingManager: false, allowedPages: [] });
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
      const isMarketingManager = roleData?.role === 'marketing_manager';

      // Fetch permissions
      const { data: permData } = await supabase
        .from('user_permissions')
        .select('page_key')
        .eq('user_id', userId);

      const allowedPages = permData?.map(p => p.page_key) || [];

      setPermissions({ isAdmin, isMarketingManager, allowedPages });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let initialised = false;

    const handleSession = async (currentSession: Session | null) => {
      if (initialised) return;
      initialised = true;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserData(currentSession.user.id);
      } else {
        setProfile(null);
        setPermissions({ isAdmin: false, isMarketingManager: false, allowedPages: [] });
        setLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (event === 'INITIAL_SESSION') {
          handleSession(currentSession);
        } else if (event === 'SIGNED_IN') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            fetchUserData(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setPermissions({ isAdmin: false, isMarketingManager: false, allowedPages: [] });
        }
      }
    );

    // Fallback: if onAuthStateChange doesn't fire INITIAL_SESSION within 3s
    const fallbackTimer = setTimeout(() => {
      if (!initialised) {
        supabase.auth.getSession().then(({ data: { session: s } }) => handleSession(s));
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
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
    setPermissions({ isAdmin: false, isMarketingManager: false, allowedPages: [] });
  };

  const hasPageAccess = (pageKey: string): boolean => {
    if (permissions.isAdmin) return true;
    return permissions.allowedPages.includes(pageKey);
  };

  const canValidateContent = (): boolean => {
    return permissions.isAdmin || permissions.isMarketingManager;
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
    canValidateContent,
    isAdmin: permissions.isAdmin,
    isMarketingManager: permissions.isMarketingManager,
  };
}
