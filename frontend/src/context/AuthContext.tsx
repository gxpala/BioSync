import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isSuperAdmin: boolean;
  isClientAdmin: boolean;
  selectedClientId: number | null;
  setSelectedClientId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mabicons_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mabicons_token'));

  const [selectedClientId, setSelectedClientIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('mabicons_selected_client_id');
    return saved ? Number(saved) : null;
  });

  const setSelectedClientId = (id: number | null) => {
    setSelectedClientIdState(id);
    if (id !== null) {
      localStorage.setItem('mabicons_selected_client_id', String(id));
    } else {
      localStorage.removeItem('mabicons_selected_client_id');
    }
  };

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('mabicons_user', JSON.stringify(res.data));
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mabicons_token', newToken);
    localStorage.setItem('mabicons_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSelectedClientIdState(null);
    localStorage.removeItem('mabicons_token');
    localStorage.removeItem('mabicons_user');
    localStorage.removeItem('mabicons_selected_client_id');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MABICONS_ADMIN';
  const isClientAdmin = user?.role === 'CLIENT_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isSuperAdmin,
        isClientAdmin,
        selectedClientId,
        setSelectedClientId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
