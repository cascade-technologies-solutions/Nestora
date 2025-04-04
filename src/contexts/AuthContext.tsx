import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// User type
export type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie name for storing user data
const USER_COOKIE_NAME = 'real_Nestora_user';
// Cookie expiration in days
const COOKIE_EXPIRATION_DAYS = 30;

// Mock user database for demo purposes
const MOCK_USERS: Record<string, { id: string; email: string; name: string; password: string }> = {};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize user from cookie
  useEffect(() => {
    const savedUser = Cookies.get(USER_COOKIE_NAME);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user cookie:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to cookie whenever it changes
  useEffect(() => {
    if (user) {
      Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
        expires: COOKIE_EXPIRATION_DAYS,
        sameSite: 'strict',
        secure: window.location.protocol === 'https:'
      });
    } else {
      Cookies.remove(USER_COOKIE_NAME);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = Object.values(MOCK_USERS).find(u => 
        u.email === email && u.password === password
      );
      
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        toast({
          title: "Login successful",
          description: `Welcome back, ${foundUser.name}!`
        });
        navigate('/');
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (Object.values(MOCK_USERS).some(u => u.email === email)) {
        toast({
          title: "Registration failed",
          description: "Email already exists",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        name,
        password
      };
      
      MOCK_USERS[newUser.id] = newUser;
      
      // Set user without password
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${name}!`
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Registration error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
