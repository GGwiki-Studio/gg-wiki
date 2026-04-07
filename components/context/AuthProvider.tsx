'use client'
import { createContext, useState, useEffect } from 'react';
import { client } from '@/api/client';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      if (!mounted) return;

      const { data } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

      if (data && mounted) {
        setProfile(data);
        setUserRole(data.role);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    // Initialize session first
    client.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      setUser(session?.user || null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Then listen for auth changes
    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user || null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, profile, loading }}>
    {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
