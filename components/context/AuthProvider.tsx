'use client'
import { createContext, useState, useEffect } from 'react';
import { client } from '@/api/client';

interface AuthContextType {
  user: any | null;
  userRole: UserRole | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

      if (data) {
        setProfile(data);
        setUserRole(data.role);
      }

      setLoading(false);
    };

    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    client.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user || null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
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
