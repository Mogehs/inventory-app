import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, db } from '../config/firebase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signInWithEmailAndPassword(email, password);
      // ensure context user reflects the signed-in user immediately
      setUser(authService.currentUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await authService.createUserWithEmailAndPassword(
        email,
        password,
      );
      await userCredential.user.updateProfile({ displayName: name });
      // update context immediately so UI shows the correct name after sign up
      setUser(authService.currentUser ?? userCredential.user);

      // create a lightweight user document so other parts can read profile info
      try {
        await db.collection('users').doc(userCredential.user.uid).set({
          uid: userCredential.user.uid,
          displayName: name,
          email: userCredential.user.email,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        // non-fatal: user doc creation failed
        console.debug('Could not create user document:', e);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
