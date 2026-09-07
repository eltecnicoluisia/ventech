'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'CASHIER' | 'INVENTORY' | 'AI_AGENT';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
}

interface TenantSettings {
  chargeIVA: boolean;
  chargeIGTF: boolean;
}

interface UserContextType {
  user: User | null;
  settings: TenantSettings;
  login: (user: User) => void;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  updateSettings: (settings: TenantSettings) => void;
  isLoaded: boolean;
}

const defaultSettings: TenantSettings = { chargeIVA: true, chargeIGTF: true };

const UserContext = createContext<UserContextType>({
  user: null,
  settings: defaultSettings,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
  updateSettings: () => {},
  isLoaded: false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<TenantSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      let storedUser = sessionStorage.getItem('ventech_user');
      if (!storedUser && typeof window !== 'undefined') {
        const demoUser: User = {
          id: 'demo-user-1',
          name: 'Luis Uzcategui',
          email: 'tecnicouzcategui@gmail.com',
          role: 'SUPERADMIN',
          tenantId: 'ventech-vzla'
        };
        sessionStorage.setItem('ventech_user', JSON.stringify(demoUser));
        storedUser = JSON.stringify(demoUser);
      }
      if (storedUser) setUser(JSON.parse(storedUser));

      const storedSettings = sessionStorage.getItem('ventech_settings');
      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch (e) {
      // ignore parse errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const login = (u: User) => {
    setUser(u);
    sessionStorage.setItem('ventech_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('ventech_user');
    window.location.href = '/login';
  };

  const updateSettings = (newSettings: TenantSettings) => {
    setSettings(newSettings);
    sessionStorage.setItem('ventech_settings', JSON.stringify(newSettings));
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    if (user.role === 'SUPERADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <UserContext.Provider value={{ user, settings, login, logout, hasRole, updateSettings, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => useContext(UserContext);
