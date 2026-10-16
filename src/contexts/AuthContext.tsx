import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { api, setPublicToken, getPublicToken } from '@/lib/api';

// Public User type
export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie name for storing user profile cache
const USER_COOKIE_NAME = 'real_Nestora_user';
const COOKIE_EXPIRATION_DAYS = 30;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize and verify user session on mount
  useEffect(() => {
    let isMounted = true;

    async function initUser() {
      const savedUser = Cookies.get(USER_COOKIE_NAME);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing user cookie:', error);
        }
      }

      // If token exists, verify with backend /auth/me
      const token = getPublicToken();
      if (token) {
        try {
          const res = await api.get<{
            id: string;
            email: string;
            name: string;
            phone?: string;
          }>('/auth/me', { authType: 'public' });

          if (isMounted && res) {
            const verifiedUser: User = {
              id: res.id,
              email: res.email,
              name: res.name,
              phone: res.phone,
            };
            setUser(verifiedUser);
            Cookies.set(USER_COOKIE_NAME, JSON.stringify(verifiedUser), {
              expires: COOKIE_EXPIRATION_DAYS,
              sameSite: 'strict',
              secure: window.location.protocol === 'https:',
            });
          }
        } catch {
          if (isMounted) {
            setPublicToken(null);
            Cookies.remove(USER_COOKIE_NAME);
            setUser(null);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<{
        accessToken: string;
        user: {
          id: string;
          email: string;
          name: string;
          phone?: string;
        };
      }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res && res.accessToken && res.user) {
        setPublicToken(res.accessToken);
        const loggedInUser: User = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          phone: res.user.phone,
        };
        setUser(loggedInUser);
        Cookies.set(USER_COOKIE_NAME, JSON.stringify(loggedInUser), {
          expires: COOKIE_EXPIRATION_DAYS,
          sameSite: 'strict',
          secure: window.location.protocol === 'https:',
        });

        toast({
          title: 'Login successful',
          description: `Welcome back, ${loggedInUser.name}!`,
        });
        navigate('/');
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid response from server.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<{
        accessToken: string;
        user: {
          id: string;
          email: string;
          name: string;
          phone?: string;
        };
      }>('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone?.trim(),
      });

      if (res && res.accessToken && res.user) {
        setPublicToken(res.accessToken);
        const newUser: User = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          phone: res.user.phone,
        };
        setUser(newUser);
        Cookies.set(USER_COOKIE_NAME, JSON.stringify(newUser), {
          expires: COOKIE_EXPIRATION_DAYS,
          sameSite: 'strict',
          secure: window.location.protocol === 'https:',
        });

        toast({
          title: 'Registration successful',
          description: `Welcome to Nestora, ${name}!`,
        });
        navigate('/');
      } else {
        toast({
          title: 'Registration failed',
          description: 'Invalid server response.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Registration error',
        description: error.message || 'An error occurred during registration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {}, { authType: 'public', skipRefresh: true }).catch(() => {});
    } finally {
      setPublicToken(null);
      Cookies.remove(USER_COOKIE_NAME);
      setUser(null);
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isLoading,
      }}
    >
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
