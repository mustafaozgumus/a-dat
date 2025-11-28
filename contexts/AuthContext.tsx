import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (pass: string) => boolean;
  logout: () => void;
  user: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde oturum kontrolü
    const storedAuth = localStorage.getItem('aidatmatik_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUser('Yönetici');
    }
    setIsLoading(false);
  }, []);

  const login = (password: string) => {
    // Basit güvenlik kontrolü. Gerçek projede bu backend'de yapılmalıdır.
    // Şifre güncellendi: 3214250
    if (password === '3214250') {
      localStorage.setItem('aidatmatik_auth', 'true');
      setIsAuthenticated(true);
      setUser('Yönetici');
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('aidatmatik_auth');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return null; // Veya bir loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
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