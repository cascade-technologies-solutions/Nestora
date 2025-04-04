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
import { allProperties, isPropertyInPriceRange } from '@/data/properties';

const AllProperties = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [filteredProperties, setFilteredProperties] = useState(allProperties);
  const [selectedProperty, setSelectedProperty] = useState<typeof allProperties[0] | null>(null);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  // Search state for AllProperties
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');

  const propertyTypes = ['Residential', 'Commercial', 'Land', 'Luxury'];
  
  const hubliLocations = [
    'Vidyanagar',
    'Keshwapur',
    'Navanagar',
    'Unkal',
    'Gokul Road'
  ];

  const priceRanges = [
    '₹50L - ₹1Cr',
    '₹1Cr - ₹2Cr',
    '₹2Cr - ₹5Cr',
    '₹5Cr - ₹10Cr',
    '₹10Cr+'
  ];
  
  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
    
    const params = new URLSearchParams(location.search);
    const locationFilter = params.get('location');
    const priceFilter = params.get('price');
    const typeFilter = params.get('type');
    
    console.log("Filtering with:", { locationFilter, priceFilter, typeFilter });
    
    let filtered = [...allProperties];
    
    // Apply type filter if present
    if (typeFilter) {
      setSelectedType(typeFilter);
      filtered = filtered.filter(property => {
        if (typeFilter === 'Residential') return property.type === 'For Sale' || property.type === 'For Rent';
        if (typeFilter === 'Luxury') return property.price.includes('Cr');
        if (typeFilter === 'Commercial') return property.title.toLowerCase().includes('commercial') || property.title.toLowerCase().includes('office');
        if (typeFilter === 'Land') return property.title.toLowerCase().includes('land') || property.beds === 0;
        return true;
      });
    }
    
    if (locationFilter) {
      setSelectedLocation(locationFilter);
      filtered = filtered.filter(property => 
        property.address.includes(locationFilter)
      );
      console.log("After location filter:", filtered.length, "properties");
    }
    
    if (priceFilter) {
      setSelectedPriceRange(priceFilter);
      filtered = filtered.filter(property => 
        isPropertyInPriceRange(property.price, priceFilter)
      );
      console.log("After price filter:", filtered.length, "properties");
    }
    
    setFilteredProperties(filtered);
    
    if (filtered.length === 0 && (locationFilter || priceFilter || typeFilter)) {
      toast({
        title: "No properties found",
        description: "Try different filter criteria to see more properties.",
        variant: "destructive",
      });
    }
  }, [location.search, toast]);

  const handlePropertyClick = (property: typeof allProperties[0]) => {
    setSelectedProperty(property);
    setIsPropertyDetailsOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply filters to the properties
    let filtered = [...allProperties];
    
    // Filter by property type
    if (selectedType) {
      filtered = filtered.filter(property => {
        if (selectedType === 'Residential') return property.type === 'For Sale' || property.type === 'For Rent';
        if (selectedType === 'Luxury') return property.price.includes('Cr');
        if (selectedType === 'Commercial') return property.title.toLowerCase().includes('commercial') || property.title.toLowerCase().includes('office');
        if (selectedType === 'Land') return property.title.toLowerCase().includes('land') || property.beds === 0;
        return true;
      });
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(property => 
        property.address.includes(selectedLocation)
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
        description: "Try different filter criteria to see more properties.",
        variant: "destructive",
      });
    }
  };

  const handleResetFilters = () => {
    setSelectedType('');
    setSelectedLocation('');
    setSelectedPriceRange('');
    setFilteredProperties(allProperties);
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Properties</h1>
                
                {location.search && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h2 className="font-medium mb-2">Applied Filters:</h2>
                    <div className="flex flex-wrap gap-2">
                      {new URLSearchParams(location.search).get('location') && (
                        <Badge variant="outline" className="bg-gray-100">
                          Location: {new URLSearchParams(location.search).get('location')}
                        </Badge>
                      )}
                      {new URLSearchParams(location.search).get('price') && (
                        <Badge variant="outline" className="bg-gray-100">
                          Price: {new URLSearchParams(location.search).get('price')}
                        </Badge>
                      )}
                      {new URLSearchParams(location.search).get('type') && (
                        <Badge variant="outline" className="bg-gray-100">
                          Type: {new URLSearchParams(location.search).get('type')}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-gray-600 max-w-2xl">
                  {filteredProperties.length === 0 
                    ? "No properties match your search criteria. Please try different filters."
                    : `Showing ${filteredProperties.length} properties that match your criteria.`
                  }
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
          
          {/* Search Section */}
          <div className="glass-panel rounded-2xl max-w-4xl mx-auto mb-12 shadow-subtle">
            <form onSubmit={handleSearch} className="p-6">
              <div className="mb-6">
                <ToggleGroup type="single" value={selectedType} onValueChange={(value) => value && setSelectedType(value)} className="flex flex-wrap justify-center gap-2">
                  <ToggleGroupItem 
                    value=""
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      selectedType === "" 
                        ? "bg-Nestora-blue text-white data-[state=on]:bg-Nestora-blue data-[state=on]:text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-Nestora-blue/10 hover:text-Nestora-blue data-[state=on]:bg-Nestora-blue/10 data-[state=on]:text-Nestora-blue"
                    )}
                  >
                    All Types
                  </ToggleGroupItem>
                  {propertyTypes.map((type) => (
                    <ToggleGroupItem 
                      key={type} 
                      value={type}
                      className={cn(
                        "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                        selectedType === type 
                          ? "bg-Nestora-blue text-white data-[state=on]:bg-Nestora-blue data-[state=on]:text-white" 
                          : "bg-gray-100 text-gray-600 hover:bg-Nestora-blue/10 hover:text-Nestora-blue data-[state=on]:bg-Nestora-blue/10 data-[state=on]:text-Nestora-blue"
                      )}
                    >
                      {type}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              
              <div className="flex flex-row gap-4 items-center">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="relative">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-Nestora-blue appearance-none"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        <option value="">Any Location</option>
                        {hubliLocations.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-Nestora-blue appearance-none"
                        value={selectedPriceRange}
                        onChange={(e) => setSelectedPriceRange(e.target.value)}
                      >
                        <option value="">Any Price</option>
                        {priceRanges.map((range) => (
                          <option key={range} value={range}>{range}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-lg h-12"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              
              {location.search && (
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Filtered results
                  </p>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-sm h-8 px-2"
                    onClick={handleResetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </form>
          </div>
          
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-4">No properties found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search filters to find properties.</p>
              <Button onClick={handleResetFilters} className="bg-Nestora-blue hover:bg-Nestora-blue/90">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredProperties.map((property, index) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  isVisible={isVisible}
                  delay={index * 100}
                  onClick={() => handlePropertyClick(property)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PropertyDetails 
        property={selectedProperty}
        isOpen={isPropertyDetailsOpen}
        onClose={() => setIsPropertyDetailsOpen(false)}
      />
    </div>
  );
};

interface PropertyCardProps {
  property: typeof allProperties[0];
  isVisible: boolean;
  delay: number;
  onClick: () => void;
}

const PropertyCard = ({ property, isVisible, delay, onClick }: PropertyCardProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const isFavorite = isInWishlist(property.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    
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
        "property-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-subtle transition-all duration-700 cursor-pointer hover:shadow-md",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
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

export default AllProperties;