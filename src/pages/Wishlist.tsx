import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Animation effect when component mounts
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  const handleRemoveFromWishlist = (propertyId: number, propertyName: string) => {
    removeFromWishlist(propertyId);
    toast({
      title: "Removed from wishlist",
      description: `${propertyName} has been removed from your wishlist.`
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className={cn(
          "transition-all duration-700 delay-100", 
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="pl-0 hover:bg-Nestora-blue/10 hover:text-Nestora-blue mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">My Wishlist</h1>
            <p className="text-gray-600 max-w-2xl">
              {wishlist.length === 0 
                ? "Your wishlist is currently empty."
                : `You have ${wishlist.length} properties in your wishlist.`
              }
            </p>
          </div>
          
          {wishlist.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-4">No properties in wishlist</h3>
              <p className="text-gray-500 mb-6">Start adding properties to your wishlist to keep track of your favorites.</p>
              <Link to="/properties">
                <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90">
                  Browse Properties
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {wishlist.map((property, index) => (
                <WishlistPropertyCard 
                  key={property.id} 
                  property={property} 
                  isVisible={isVisible}
                  delay={index * 100}
                  onRemove={() => handleRemoveFromWishlist(property.id, property.title)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface WishlistPropertyCardProps {
  property: {
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
  isVisible: boolean;
  delay: number;
  onRemove: () => void;
}

const WishlistPropertyCard = ({ property, isVisible, delay, onRemove }: WishlistPropertyCardProps) => {
  return (
    <div 
      className={cn(
        "property-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-subtle transition-all duration-700",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative img-hover-zoom h-64">
        <img 
          src={property.image} 
          alt={property.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 flex gap-2">
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-Nestora-dark mb-1">{property.title}</h3>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            <span>{property.address}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-Nestora-blue font-bold text-xl">{property.price}</div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between">
          <div className="flex items-center text-gray-500 text-sm">
            <Bed className="h-4 w-4 mr-1" />
            <span>{property.beds} Beds</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Bath className="h-4 w-4 mr-1" />
            <span>{property.baths} Baths</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Maximize className="h-4 w-4 mr-1" />
            <span>{property.sqft} sqft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;