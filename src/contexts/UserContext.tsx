import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, logout as firebaseLogout } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  isFirebase?: boolean;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("broadcaster_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userData = {
        id: currentUser.uid,
        email: currentUser.email || "",
        name: currentUser.displayName || currentUser.email?.split('@')[0] || "Usuario",
        photoUrl: currentUser.photoURL || undefined,
        isFirebase: true
      };
      setUser(userData);
      localStorage.setItem("broadcaster_user", JSON.stringify(userData));
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Usuario",
          photoUrl: firebaseUser.photoURL || undefined,
          isFirebase: true
        };
        setUser(userData);
        localStorage.setItem("broadcaster_user", JSON.stringify(userData));
      } else {
        // Only clear if the current user was a Firebase user
        setUser(prev => {
          if (prev?.isFirebase) {
            localStorage.removeItem("broadcaster_user");
            return null;
          }
          return prev;
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("broadcaster_user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      localStorage.removeItem("broadcaster_user");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
