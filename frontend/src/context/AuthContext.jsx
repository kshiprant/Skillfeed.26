import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [token, setToken] = useState(localStorage.getItem('skillfeed_token'));
  const [user, setUser] = useState(null);

  // loading only used during first validation
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (!token) return;

    const bootstrap = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (err) {
        localStorage.removeItem('skillfeed_token');
        setToken(null);
        setUser(null);
      }
    };

    bootstrap();

  }, [token]);

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload);

    localStorage.setItem('skillfeed_token', data.token);

    setToken(data.token);
    setUser(data.user);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);

    localStorage.setItem('skillfeed_token', data.token);

    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('skillfeed_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await api.get('/users/me');
    setUser(data);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      setUser
    }),
    [token, user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
