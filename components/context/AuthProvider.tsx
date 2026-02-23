'use client'
import { createContext, useState, useEffect, } from 'react';
import { client } from '@/api/client';

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    })

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    })

    return () => {
      authListener.subscription.unsubscribe();
    }

  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider };