import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => { checkUserAuth(); }, []);
  const checkUserAuth = async () => {
    setIsLoadingAuth(true); setAuthError(null);
    try { const currentUser = await base44.auth.me(); setUser(currentUser); setIsAuthenticated(true); }
    catch (error) { setUser(null); setIsAuthenticated(false); if (error.status !== 401) setAuthError({ type: 'unknown', message: error.message }); }
    finally { setIsLoadingAuth(false); setAuthChecked(true); }
  };
  const logout = async () => { await base44.auth.logout(); setUser(null); setIsAuthenticated(false); };
  const navigateToLogin = () => { window.location.href = '/login'; };
  return <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; };
