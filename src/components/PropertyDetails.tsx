import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bed, Bath, Maximize, MapPin, Heart, Phone, Mail, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist, WishlistProperty } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { CONFIG, isWhatsAppEnabled, getWhatsAppLink } from '@/config';

interface PropertyDetailsProps {
  property: {
    id: number | string;
    title: string;
    price: string;
    address: string;
    beds: number;
    baths: number;
    sqft: number;
    type: string;
    isNew: boolean;
    image: string;
    category?: string;
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
  
  const images = [
    property.image,
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
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

  const whatsappActive = isWhatsAppEnabled();
  const whatsappUrl = whatsappActive ? getWhatsAppLink(`Hello Nestora, I am interested in property details for "${property.title}" in ${property.address}.`) : "#";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-auto max-h-[90vh] bg-white border border-gray-100">
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
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 bg-black/10 py-1.5 rounded-full max-w-fit mx-auto px-4 backdrop-blur-sm">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    activeImage === idx ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <DialogHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="text-xs font-semibold px-3 py-1 bg-Nestora-blue text-white border-none uppercase tracking-wide">
                      {property.type}
                    </Badge>
                    <Badge className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 border-none uppercase tracking-wide">
                      {property.category || "Real Estate"}
                    </Badge>
                    {property.isNew && (
                      <Badge className="bg-green-500 text-white text-xs font-semibold px-3 py-1 border-none">
                        New
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline"
                    size="icon"
                    className={cn(
                      "rounded-full h-9 w-9",
                      isFavorite 
                        ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white" 
                        : "border-gray-200"
                    )}
                    onClick={handleToggleWishlist}
                  >
                    <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
                  </Button>
                </div>
                
                <DialogTitle className="text-2xl font-bold mb-2 font-display text-Nestora-dark">{property.title}</DialogTitle>
                <DialogDescription className="flex items-center text-sm text-gray-500 mb-2">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  {property.address}
                </DialogDescription>
                
                <div className="text-Nestora-blue font-bold text-2xl mb-4">{property.price}</div>
              </DialogHeader>
              
              {/* Features */}
              <div className="grid grid-cols-3 gap-2 mb-6 border-y border-gray-100 py-4 text-center">
                <div className="flex flex-col items-center justify-center p-2">
                  <Bed className="h-5 w-5 text-Nestora-blue mb-1" />
                  <span className="text-xs text-gray-500 font-medium">{property.beds} Bed{property.beds !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2">
                  <Bath className="h-5 w-5 text-Nestora-blue mb-1" />
                  <span className="text-xs text-gray-500 font-medium">{property.baths} Bath{property.baths !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2">
                  <Maximize className="h-5 w-5 text-Nestora-blue mb-1" />
                  <span className="text-xs text-gray-500 font-medium">{property.sqft} sqft</span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                This property belongs to our Real Estate division. Nestora provides complete support including site planning, building layout inspection, municipal documentation facilitation, and property valuation.
              </p>
            </div>
            
            {/* Action Desk */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-semibold text-xs text-Nestora-dark uppercase tracking-wider mb-3">Enquiry Desk</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {CONFIG.CONTACT_PHONE ? (
                  <a href={`tel:${CONFIG.CONTACT_PHONE.replace(/\s+/g, '')}`} className="w-full">
                    <Button size="sm" className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white w-full">
                      <Phone className="h-3.5 w-3.5 mr-2" />
                      Call Desk
                    </Button>
                  </a>
                ) : (
                  <Link to="/contact?service=Real Estate" className="w-full" onClick={onClose}>
                    <Button size="sm" className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white w-full">
                      Request Callback
                    </Button>
                  </Link>
                )}

                {CONFIG.CONTACT_EMAIL ? (
                  <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="w-full">
                    <Button size="sm" variant="outline" className="border-Nestora-blue text-Nestora-blue hover:bg-Nestora-blue/5 w-full">
                      <Mail className="h-3.5 w-3.5 mr-2" />
                      Email Desk
                    </Button>
                  </a>
                ) : (
                  <Link to="/contact?service=Real Estate" className="w-full" onClick={onClose}>
                    <Button size="sm" variant="outline" className="border-Nestora-blue text-Nestora-blue hover:bg-Nestora-blue/5 w-full">
                      Send Message
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link to="/contact?service=Real Estate" className="w-full" onClick={onClose}>
                  <Button size="sm" className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200">
                    <Calendar className="h-3.5 w-3.5 mr-2" />
                    Schedule Site Visit
                  </Button>
                </Link>

                {whatsappActive && (
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                    onClick={onClose}
                  >
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Enquire via WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetails;