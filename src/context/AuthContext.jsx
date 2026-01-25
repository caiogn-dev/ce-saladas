/**
 * Auth Context - Uses unified Store API for authentication
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as storeApi from '../services/storeApi';

const AuthContext = createContext();
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
let profileFetchPromise = null;
let profileCache = null;
let profileCacheTs = 0;

const readProfileCache = () => {
  if (!profileCache || !profileCacheTs) {
    return null;
  }
  if (Date.now() - profileCacheTs > PROFILE_CACHE_TTL_MS) {
    profileCache = null;
    profileCacheTs = 0;
    return null;
  }
  return profileCache;
};

const writeProfileCache = (data) => {
  profileCache = data;
  profileCacheTs = Date.now();
};

const clearProfileCache = () => {
  profileCache = null;
  profileCacheTs = 0;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  const fetchProfile = useCallback(async ({ force = false } = {}) => {
    const cached = readProfileCache();
    if (!force && cached) {
      setProfile(cached);
      setUser(cached);
      return cached;
    }

    if (profileFetchPromise) {
      return profileFetchPromise;
    }

    profileFetchPromise = (async () => {
      try {
        const data = await storeApi.getProfile();
        setProfile(data);
        setUser(data);
        writeProfileCache(data);
        return data;
      } catch (error) {
        if (error.response?.status === 401) {
          clearProfileCache();
          setUser(null);
          setProfile(null);
          return null;
        }
        return null;
      } finally {
        profileFetchPromise = null;
      }
    })();

    return profileFetchPromise;
  }, []);

  useEffect(() => {
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    const initAuth = async () => {
      await fetchProfile();
      setLoading(false);
    };
    initAuth();
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    try {
      const data = await storeApi.loginUser(email, password);
      const loginUser = data?.user || null;
      setUser(loginUser);
      const profileData = await fetchProfile({ force: true });
      return { success: true, profile: profileData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.non_field_errors?.[0]
          || error.response?.data?.detail
          || 'E-mail, celular ou senha inválidos'
      };
    }
  };

  const signOut = async () => {
    try {
      await storeApi.logoutUser();
    } catch {
      // Ignore logout errors
    }
    clearProfileCache();
    setUser(null);
    setProfile(null);
  };

  const updateUserProfile = async (data) => {
    const updatedData = await storeApi.updateProfile(data);
    setProfile(updatedData);
    writeProfileCache(updatedData);
    return updatedData;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user || profile),
      signIn,
      signOut,
      updateProfile: updateUserProfile,
      fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
