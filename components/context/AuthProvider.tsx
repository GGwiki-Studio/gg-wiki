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
      try {
        const { data } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

        if (mounted && data) {
          setProfile(data);
          setUserRole(data.role);
        }
      } catch (err) {
        console.error('fetchProfile error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    client.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    const { data: authListener } = client.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            setLoading(true);
            fetchProfile(session.user.id);
          }
        }
      }
    );

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
