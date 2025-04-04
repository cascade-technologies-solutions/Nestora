
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bed, Bath, Maximize, MapPin, Heart, Phone, Mail, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist, WishlistProperty } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PropertyDetailsProps {
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
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyDetails = ({ property, isOpen, onClose }: PropertyDetailsProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  
  if (!property) return null;
  
  const isFavorite = isInWishlist(property.id);
  
  // Mock additional images for demo
  const images = [
    property.image,
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  ];

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to add properties to your wishlist",
        variant: "destructive",
      });
      onClose();
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-auto max-h-[90vh]">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Images Section */}
          <div className="relative">
            <div className="h-72 md:h-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
              <img 
                src={images[activeImage]} 
                alt={property.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail navigation */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    activeImage === idx ? "bg-white w-6" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-6 md:p-8 flex flex-col h-full">
            <DialogHeader>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge className={cn(
                    "text-xs font-semibold px-3 py-1 mb-3",
                    property.type === "For Sale" 
                      ? "bg-Nestora-blue text-white" 
                      : "bg-purple-500 text-white"
                  )}>
                    {property.type}
                  </Badge>
                  {property.isNew && (
                    <Badge className="bg-green-500 text-white text-xs font-semibold px-3 py-1 ml-2">
                      New
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full",
                    isFavorite 
                      ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white" 
                      : "border-gray-200"
                  )}
                  onClick={handleToggleWishlist}
                >
                  <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
                </Button>
              </div>
              
              <DialogTitle className="text-2xl font-bold mb-2">{property.title}</DialogTitle>
              <DialogDescription className="flex items-center text-base text-gray-500 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address}
              </DialogDescription>
              
              <div className="text-Nestora-blue font-bold text-2xl mb-6">{property.price}</div>
            </DialogHeader>
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-6 border-y border-gray-100 py-4">
              <div className="flex flex-col items-center justify-center p-3">
                <Bed className="h-5 w-5 text-Nestora-blue mb-1" />
                <span className="text-sm text-gray-500">{property.beds} Beds</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3">
                <Bath className="h-5 w-5 text-Nestora-blue mb-1" />
                <span className="text-sm text-gray-500">{property.baths} Baths</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3">
                <Maximize className="h-5 w-5 text-Nestora-blue mb-1" />
                <span className="text-sm text-gray-500">{property.sqft} sqft</span>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 mb-6">
              This beautiful property offers modern amenities and a prime location. Perfect for families looking for comfort and convenience.
            </p>
            
            {/* Contact */}
            <div className="bg-gray-50 p-4 rounded-lg mt-auto">
              <h4 className="font-medium mb-3">Contact Agent</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" className="border-Nestora-blue text-Nestora-blue hover:bg-Nestora-blue/10">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
              <Button className="w-full mt-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Viewing
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetails;