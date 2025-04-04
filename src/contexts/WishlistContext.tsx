import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Property type for wishlist items
export type WishlistProperty = {
  id: number;
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  isNew: boolean;
  image: string;
};

type WishlistContextType = {
  wishlist: WishlistProperty[];
  addToWishlist: (property: WishlistProperty) => void;
  removeFromWishlist: (propertyId: number) => void;
  isInWishlist: (propertyId: number) => boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
// Cookie name for storing wishlist data
const WISHLIST_COOKIE_NAME = 'real_Nestora_wishlist';
// Cookie expiration in days (e.g., 30 days)
const COOKIE_EXPIRATION_DAYS = 30;

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Initialize state from cookies if available and user is authenticated
  const [wishlist, setWishlist] = useState<WishlistProperty[]>(() => {
    if (!isAuthenticated) return [];
 
    const savedWishlist = Cookies.get(WISHLIST_COOKIE_NAME);
    try {
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error('Error parsing wishlist cookie:', error);
      return [];
    }
  });

  // Clear wishlist when user logs out and load user's wishlist when logged in
  useEffect(() => {
    if (isAuthenticated) {
      const savedWishlist = Cookies.get(WISHLIST_COOKIE_NAME);
      try {
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist));
        }
      } catch (error) {
        console.error('Error parsing wishlist cookie:', error);
      }
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated]);

  // Save to cookies whenever wishlist changes
  useEffect(() => {
    if (isAuthenticated) {
      try {
        Cookies.set(WISHLIST_COOKIE_NAME, JSON.stringify(wishlist), { 
          expires: COOKIE_EXPIRATION_DAYS,
          sameSite: 'strict',
          secure: window.location.protocol === 'https:'
        });
      } catch (error) {
        console.error('Error saving wishlist to cookie:', error);
      }
    }
  }, [wishlist, isAuthenticated]);

  const addToWishlist = (property: WishlistProperty) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to add properties to your wishlist",
      });
      navigate('/login');
      return;
    }
    
    setWishlist(prev => {
      // Only add if not already in wishlist
      if (!prev.some(item => item.id === property.id)) {
        return [...prev, property];
      }
      return prev;
    });
  };

  const removeFromWishlist = (propertyId: number) => {
    if (!isAuthenticated) return;
    
    setWishlist(prev => prev.filter(property => property.id !== propertyId));
  };

  const isInWishlist = (propertyId: number) => {
    if (!isAuthenticated) return false;
    
    return wishlist.some(property => property.id === propertyId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};