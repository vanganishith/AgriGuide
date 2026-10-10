import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BuyerProfile } from '../types/marketplace';
import { BuyerAPI } from '../services/api';

interface AuthContextType {
  buyerId: string | null;
  profile: BuyerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (id: string, token?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default demo buyer ID from existing database
const DEFAULT_BUYER_ID = '8de5c2e3-9052-462a-9e92-39b33983e8f1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [buyerId, setBuyerId] = useState<string | null>(() => {
    return localStorage.getItem('agriguide_buyer_id') || DEFAULT_BUYER_ID;
  });
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    if (!buyerId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const p = await BuyerAPI.getProfile();
      setProfile(p);
    } catch {
      // Offline / error
    } finally {
      setIsLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    if (buyerId) {
      localStorage.setItem('agriguide_buyer_id', buyerId);
    }
    refreshProfile();
  }, [buyerId, refreshProfile]);

  const login = async (id: string, token?: string) => {
    setIsLoading(true);
    setBuyerId(id);
    localStorage.setItem('agriguide_buyer_id', id);
    if (token) {
      localStorage.setItem('agriguide_buyer_token', token);
    } else {
      localStorage.removeItem('agriguide_buyer_token');
    }
    await refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem('agriguide_buyer_id');
    localStorage.removeItem('agriguide_buyer_token');
    setBuyerId(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        buyerId,
        profile,
        isAuthenticated: Boolean(buyerId),
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
