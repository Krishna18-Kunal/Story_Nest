
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/auth/me')
      .then(r => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,

    async login(credentials) {
      const r = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      setUser(r.user);
      return r;
    },

    async register(details) {
      const r = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(details)
      });

      setUser(r.user);
      return r;
    },

    async googleLogin(credential) {
      const r = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential })
      });

      setUser(r.user);
      return r;
    },

    async logout() {
      await apiRequest('/auth/logout', { method: 'POST' });
      setUser(null);
    }
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
