import { useState, useEffect } from 'react';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, Heart, Building, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useWishlist, WishlistProperty } from '@/contexts/WishlistContext';
import PropertyDetails from '@/components/PropertyDetails';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { isPropertyInPriceRange } from '@/data/properties';
import { propertyRepository } from '@/admin/repositories/propertyRepository';
import type { AdminProperty } from '@/admin/types/admin';

const RealEstate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<AdminProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  // Search states
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');

  const propertyTypes = ['Residential', 'Commercial', 'Plots & Land'];
  
  const hubliLocations = [
    'Vidyanagar',
    'Keshwapur',
    'Navanagar',
    'Unkal',
    'Gokul Road'
  ];

  const priceRanges = [
    '50L - 1Cr',
    '1Cr - 2Cr',
    '2Cr - 5Cr',
    '5Cr - 10Cr',
    '10Cr+'
  ];

  useEffect(() => {
    propertyRepository.getPublished().then(setProperties);
  }, []);
  
  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
    
    if (properties.length === 0) return;
    
    const params = new URLSearchParams(location.search);
    const locationFilter = params.get('location');
    const priceFilter = params.get('price');
    const typeFilter = params.get('type');
    
    let filtered = [...properties];
    
    if (typeFilter) {
      const formattedType = typeFilter === 'Land' ? 'Plots & Land' : typeFilter;
      setSelectedType(formattedType);
      filtered = filtered.filter(property => property.category === formattedType);
    }
    
    if (locationFilter) {
      setSelectedLocation(locationFilter);
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    if (priceFilter) {
      setSelectedPriceRange(priceFilter);
      filtered = filtered.filter(property => 
        isPropertyInPriceRange(property.price, priceFilter)
      );
    }
    
    setFilteredProperties(filtered);
  }, [location.search, properties]);

  const handlePropertyClick = (property: AdminProperty) => {
    setSelectedProperty(property);
    setIsPropertyDetailsOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    let filtered = [...properties];
    
    if (selectedType) {
      filtered = filtered.filter(property => property.category === selectedType);
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    if (selectedPriceRange) {
      filtered = filtered.filter(property => 
        isPropertyInPriceRange(property.price, selectedPriceRange)
      );
    }
    
    setFilteredProperties(filtered);
    
    if (filtered.length === 0) {
      toast({
        title: "No properties found",
        description: "Try adjusting your search criteria to see other opportunities.",
        variant: "destructive",
      });
    }
  };

  const handleResetFilters = () => {
    setSelectedType('');
    setSelectedLocation('');
    setSelectedPriceRange('');
    setFilteredProperties(properties);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
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
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 font-display text-Nestora-dark">Property Opportunities</h1>
                  <p className="text-gray-600 max-w-2xl">
                    Explore verified real estate opportunities across Hubli. Contact our division desk directly for site visits and structural assistance.
                  </p>
                </div>
                <Link to="/wishlist">
                  <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full group">
                    My Wishlist
                    <Heart className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Search Panel */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl max-w-4xl mx-auto mb-12 shadow-subtle p-6">
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <ToggleGroup 
                    type="single" 
                    value={selectedType} 
                    onValueChange={(value) => setSelectedType(value || '')} 
                    className="flex flex-wrap justify-center gap-2"
                  >
                    <ToggleGroupItem 
                      value=""
                      className={cn(
                        "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border-none",
                        selectedType === "" 
                          ? "bg-Nestora-blue text-white data-[state=on]:bg-Nestora-blue data-[state=on]:text-white shadow-sm" 
                          : "bg-white text-gray-600 hover:bg-Nestora-blue/10 hover:text-Nestora-blue"
                      )}
                    >
                      All Categories
                    </ToggleGroupItem>
                    {propertyTypes.map((type) => (
                      <ToggleGroupItem 
                        key={type} 
                        value={type}
                        className={cn(
                          "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border-none",
                          selectedType === type 
                            ? "bg-Nestora-blue text-white data-[state=on]:bg-Nestora-blue data-[state=on]:text-white shadow-sm" 
                            : "bg-white text-gray-600 hover:bg-Nestora-blue/10 hover:text-Nestora-blue"
                        )}
                      >
                        {type}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-Nestora-blue appearance-none text-sm"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        <option value="">Any Location</option>
                        {hubliLocations.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-Nestora-blue appearance-none text-sm"
                        value={selectedPriceRange}
                        onChange={(e) => setSelectedPriceRange(e.target.value)}
                      >
                        <option value="">Any Price Range</option>
                        {priceRanges.map((range) => (
                          <option key={range} value={range}>{`₹${range}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-lg h-12 px-6 w-full md:w-auto"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Properties
                  </Button>
                </div>
                
                {(selectedType || selectedLocation || selectedPriceRange) && (
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Filters applied</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-xs h-6 px-2 text-red-500 hover:text-red-700"
                      onClick={handleResetFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </form>
            </div>
            
            {filteredProperties.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <h3 className="text-xl font-medium mb-2 text-gray-700">No matching properties</h3>
                <p className="text-gray-500 mb-6 text-sm">Please modify your search parameters or check back later.</p>
                <Button onClick={handleResetFilters} className="bg-Nestora-blue hover:bg-Nestora-blue/90">
                  Reset Search
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property, index) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    isVisible={isVisible}
                    delay={index * 50}
                    onClick={() => handlePropertyClick(property)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <PropertyDetails 
        property={selectedProperty}
        isOpen={isPropertyDetailsOpen}
        onClose={() => setIsPropertyDetailsOpen(false)}
      />

      <Footer />
    </div>
  );
};

interface PropertyCardProps {
  property: AdminProperty;
  isVisible: boolean;
  delay: number;
  onClick: () => void;
}

const PropertyCard = ({ property, isVisible, delay, onClick }: PropertyCardProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const isFavorite = isInWishlist(property.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFavorite) {
      removeFromWishlist(property.id);
      toast({
        title: "Removed from wishlist",
        description: `${property.title} removed from wishlist.`
      });
    } else {
      addToWishlist(property as WishlistProperty);
      toast({
        title: "Added to wishlist",
        description: `${property.title} added to wishlist.`
      });
    }
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-xl overflow-hidden border border-gray-100 shadow-subtle transition-all duration-700 cursor-pointer hover:shadow-md flex flex-col h-full justify-between",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div>
        <div className="relative h-56 overflow-hidden">
          <img 
            src={property.image} 
            alt={property.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-Nestora-blue text-white text-xs font-semibold px-3 py-1 border-none uppercase tracking-wide">
              {property.type}
            </Badge>
            <Badge className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 border-none uppercase tracking-wide">
              {property.category}
            </Badge>
          </div>
          <button 
            className={cn(
              "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm",
              isFavorite 
                ? "bg-red-500 text-white" 
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
            onClick={handleToggleWishlist}
          >
            <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-Nestora-dark mb-1 font-display line-clamp-1">{property.title}</h3>
          
          <div className="flex items-center text-gray-400 text-xs mb-3">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>

          <div className="text-Nestora-blue font-bold text-xl mb-4">{property.price}</div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-gray-50 flex justify-between text-gray-500 text-xs">
        <div className="flex items-center">
          <Bed className="h-3.5 w-3.5 mr-1" />
          <span>{property.beds} Bed{property.beds !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center">
          <Bath className="h-3.5 w-3.5 mr-1" />
          <span>{property.baths} Bath{property.baths !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center">
          <Maximize className="h-3.5 w-3.5 mr-1" />
          <span>{property.sqft} sqft</span>
        </div>
      </div>
    </div>
  );
};

export default RealEstate;
