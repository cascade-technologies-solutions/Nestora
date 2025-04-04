import React from 'react';
import { Bed, Bath, Maximize, MapPin, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWishlist, WishlistProperty } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { allProperties } from '@/data/properties';

interface PropertyCardProps {
  property: typeof allProperties[0];
  isVisible: boolean;
  delay: number;
  onClick: () => void;
}

const PropertyCard = ({ property, isVisible, delay, onClick }: PropertyCardProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isFavorite = isInWishlist(property.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to add properties to your wishlist",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (isFavorite) {
      removeFromWishlist(property.id);
      toast({
        title: "Removed from wishlist",
        description: `${property.title} has been removed from your wishlist.`
      });
    } else {
      addToWishlist(property as WishlistProperty);
      toast({
        title: "Added to wishlist",
        description: `${property.title} has been added to your wishlist.`
      });
    }
  };

  return (
    <div 
      className={cn(
        "property-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-subtle transition-all duration-700 cursor-pointer hover:shadow-md w-full h-full",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="relative img-hover-zoom h-48 sm:h-56 md:h-64">
        <img 
          src={property.image} 
          alt={property.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <Badge className={cn(
            "text-xs font-semibold px-3 py-1",
            property.type === "For Sale" 
              ? "bg-Nestora-blue text-white" 
              : "bg-purple-500 text-white"
          )}>
            {property.type}
          </Badge>
          {property.isNew && (
            <Badge className="bg-green-500 text-white text-xs font-semibold px-3 py-1">
              New
            </Badge>
          )}
        </div>
        <button 
          className={cn(
            "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            isFavorite 
              ? "bg-red-500 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-100"
          )}
          onClick={handleToggleWishlist}
        >
          <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-3 sm:p-4 md:p-5">
        <div className="mb-2">
          <h3 className="text-base md:text-lg font-bold text-Nestora-dark mb-1 line-clamp-1">{property.title}</h3>
          <div className="flex items-center text-gray-500 text-xs sm:text-sm">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="text-Nestora-blue font-bold text-base sm:text-lg md:text-xl">{property.price}</div>
        </div>

        <div className="border-t border-gray-100 pt-3 sm:pt-4 flex justify-between">
          <div className="flex items-center text-gray-500 text-xs sm:text-sm">
            <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>{property.beds} Beds</span>
          </div>
          <div className="flex items-center text-gray-500 text-xs sm:text-sm">
            <Bath className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>{property.baths} Baths</span>
          </div>
          <div className="flex items-center text-gray-500 text-xs sm:text-sm">
            <Maximize className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>{property.sqft} sqft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
