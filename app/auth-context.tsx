import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { auth, db } from '@/config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            setUser(userData);
            setIsLoggedIn(true);
          } else {
            setUser(null);
            setIsLoggedIn(false);
          }
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, userType: 'borrower' | 'lender' | 'both') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const userData: UserData = {
        email,
        name,
        userType
      };

      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, {
        ...userData,
        createdAt: new Date().toISOString()
      });

      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
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
