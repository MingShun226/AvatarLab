
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, phone?: string, referrerCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone: phone, // Save phone to auth.users table
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
          full_name: name,
          phone: phone,
          referrer_code: referrerCode
        }
      }
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // Update last_login timestamp after successful login
    if (data?.user && !error) {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return { data, error };
  };

  const signOut = async () => {
    try {
      // Check if there's an active session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Use local scope to avoid 403 errors with expired sessions
        const { error } = await supabase.auth.signOut({ scope: 'local' });

        if (error && error.message !== 'Auth session missing!') {
          console.warn('Logout error:', error.message);
        }
      }

      // Clear local state regardless of session status
      setSession(null);
      setUser(null);

      return { error: null }; // Always return success to clear UI state
    } catch (err) {
      console.warn('Logout exception (clearing local state anyway):', err);
      // Clear local state even on exception
      setSession(null);
      setUser(null);
      return { error: null }; // Always return success to clear UI state
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };
};
