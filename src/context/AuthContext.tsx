import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

export interface User {
  id: string;
  twitter_username?: string;
  twitter_name?: string;
  twitter_profile_image?: string;
}

export interface Wallet {
  address: string;
  wallet_type: string;
  verified: boolean;
}

export interface BuilderProfile {
  builder_id: string;
  name: string;
  title?: string;
  role?: string;
  bio?: string;
  stack?: string[];
  github?: string;
  twitter?: string;
  website?: string;
  theme_id?: string;
  badge_number?: string;
  photo_url?: string;
  card_image_url?: string;
  card_image_base64?: string;
  crop?: { x: number; y: number };
  zoom?: number;
  rotation?: number;
  cropped_area_pixels?: any;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: BuilderProfile | null;
  wallets: Wallet[];
  loading: boolean;
  loginWithTwitter: () => void;
  logout: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  disconnectWallet: (address: string) => Promise<void>;
  saveProfile: (updates: Partial<BuilderProfile>) => Promise<BuilderProfile | null>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BuilderProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setProfile(data.profile);
          setWallets(data.wallets || []);
        } else {
          setUser(null);
          setProfile(null);
          setWallets([]);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithTwitter = () => {
    window.location.href = '/api/auth/twitter/login';
  };

  const logout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        setProfile(null);
        setWallets([]);
        toast('Logged out successfully', 'success');
      }
    } catch {
      toast('Failed to log out', 'error');
    }
  };

  const connectMetaMask = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
      if (isMobile) {
        const dappPath = `${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
        const deepLink = `https://metamask.app.link/dapp/${dappPath}`;
        toast('Opening MetaMask mobile app…', 'info');
        window.location.href = deepLink;
        return;
      }
      toast('MetaMask extension not detected. Install MetaMask or open this link inside the MetaMask mobile app.', 'error');
      return;
    }

    try {
      const provider = Array.isArray(ethereum.providers)
        ? (ethereum.providers.find((p: any) => p?.isMetaMask) || ethereum)
        : ethereum;

      // 1. Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      if (!address) throw new Error('No accounts returned from MetaMask');

      // 2. Generate and sign ownership message
      const timestamp = Date.now();
      const message = `Sign to verify ownership of wallet address: ${address.toLowerCase()}\nTimestamp: ${timestamp}`;
      
      // Encode message to hex using browser-native APIs (no Node.js Buffer needed)
      const encoder = new TextEncoder();
      const msgBytes = encoder.encode(message);
      const hexMsg = '0x' + Array.from(msgBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const signature = await provider.request({
        method: 'personal_sign',
        params: [hexMsg, address],
      });

      // 3. Verify signature in the backend
      const verifyRes = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.error || 'Verification failed');
      }

      await refreshSession();
      toast('Wallet connected & verified successfully!', 'success');
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      if (err?.code === 4001) {
        toast('MetaMask signature request was rejected.', 'error');
        return;
      }
      toast(err.message || 'MetaMask connection failed', 'error');
    }
  };

  const disconnectWallet = async (address: string) => {
    try {
      const res = await fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (res.ok) {
        await refreshSession();
        toast('Wallet disconnected', 'success');
      } else {
        toast('Failed to disconnect wallet', 'error');
      }
    } catch {
      toast('Failed to disconnect wallet', 'error');
    }
  };

  const saveProfile = async (updates: Partial<BuilderProfile>): Promise<BuilderProfile | null> => {
    try {
      const res = await fetch('/api/builder/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        return data.profile;
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to save builder profile', 'error');
        return null;
      }
    } catch {
      toast('Failed to connect to profile server', 'error');
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallets,
        loading,
        loginWithTwitter,
        logout,
        connectMetaMask,
        disconnectWallet,
        saveProfile,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
