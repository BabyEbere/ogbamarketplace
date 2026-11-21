'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserSessionData,
  getCurrentUserAction,
  logoutUserAction,
} from '@/actions/auth';

interface UserContextType {
  user: UserSessionData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: UserSessionData | null) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getCurrentUserAction();
      setUser(session);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    await logoutUserAction();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}

