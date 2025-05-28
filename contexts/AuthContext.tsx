import React, { createContext, useContext, useState, useEffect } from 'react';

// Define user type
interface EmergencyContact {
  relation: string;
  name: string;
  phone: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  emergencyContact: EmergencyContact;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: any) => Promise<void>;
  signOut: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock auth functions that would be replaced by real API calls
const mockSignIn = async (email: string, password: string): Promise<User> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, any credentials will work
  return {
    id: '123456',
    name: 'Sarah Johnson',
    email: email,
    profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    emergencyContact: {
      relation: 'father',
      name: 'Robert Johnson',
      phone: '+1 (555) 123-4567',
    },
  };
};

const mockSignUp = async (userData: any): Promise<User> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    id: '123457',
    name: userData.name,
    email: userData.email,
    profileImage: userData.profileImage,
    emergencyContact: userData.emergencyContact,
  };
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Check for stored user data (simulating persistence)
    const checkAuth = async () => {
      try {
        // In a real app, would check AsyncStorage or similar
        // For demo, we'll assume not logged in initially
        setUser(null);
      } catch (error) {
        console.error('Failed to check auth status', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const user = await mockSignIn(email, password);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signUp = async (userData: any) => {
    try {
      setIsLoading(true);
      const user = await mockSignUp(userData);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = () => {
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};