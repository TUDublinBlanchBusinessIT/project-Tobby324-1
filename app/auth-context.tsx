import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

interface UserData {
  email: string;
  name: string;
  userType: 'borrower' | 'lender' | 'both';
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, userType: 'borrower' | 'lender' | 'both') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (token && userData) {
          setIsLoggedIn(true);
          setUser(JSON.parse(userData));
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading, segments, router]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const token = `token_${email}`;
      await AsyncStorage.setItem('authToken', token);
      
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.email === email) {
          setUser(user);
          setIsLoggedIn(true);
          return;
        }
      }
      
      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, userType: 'borrower' | 'lender' | 'both') => {
    try {
      const userData: UserData = {
        email,
        name,
        userType
      };

      const token = `token_${email}`;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
