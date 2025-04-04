import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PropertyDetails from './PropertyDetails';
import SearchPanel from './property/SearchPanel';
import PropertyList from './property/PropertyList';

import { allProperties, isPropertyInPriceRange, convertPriceToValue } from '@/data/properties';

// Enhanced property filtering with more properties for each category
const commercialProperties = allProperties.filter(prop => 
  prop.title.toLowerCase().includes('commercial') || 
  prop.title.toLowerCase().includes('office') ||
  prop.title.toLowerCase().includes('shop') ||
  prop.title.toLowerCase().includes('retail') ||
  prop.title.toLowerCase().includes('warehouse') ||
  prop.beds === 0
);

const landProperties = allProperties.filter(prop => 
  prop.title.toLowerCase().includes('land') || 
  prop.title.toLowerCase().includes('plot') ||
  prop.title.toLowerCase().includes('acre') ||
  prop.title.toLowerCase().includes('farm') ||
  (prop.beds === 0 && prop.baths === 0)
);

const luxuryProperties = allProperties.filter(prop => 
  prop.price.includes('Cr') || 
  prop.title.toLowerCase().includes('luxury') ||
  prop.title.toLowerCase().includes('premium') ||
  prop.title.toLowerCase().includes('villa') ||
  prop.title.toLowerCase().includes('penthouse') ||
  convertPriceToValue(prop.price) >= 100 // 1 Cr or more
);

const FeaturedProperties = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [properties, setProperties] = useState(allProperties.slice(0, 4));
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [showFiltered, setShowFiltered] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<typeof allProperties[0] | null>(null);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  const [showAllProperties, setShowAllProperties] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState('Residential');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    let filtered = [...allProperties];
    
    if (selectedType) {
      filtered = filtered.filter(property => {
        if (selectedType === 'Residential') {
          return property.type === 'For Sale' || property.type === 'For Rent';
        }
        if (selectedType === 'Commercial') {
          return commercialProperties.some(p => p.id === property.id);
        }
        if (selectedType === 'Land') {
          return landProperties.some(p => p.id === property.id);
        }
        if (selectedType === 'Luxury') {
          return luxuryProperties.some(p => p.id === property.id);
        }
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
    setShowFiltered(true);
    setShowAllProperties(true);
    
    if (filtered.length === 0) {
      toast({
        title: "No properties found",
        description: "Try different filter criteria to see more properties.",
        variant: "destructive",
      });
    }
  };

  const handleResetFilters = () => {
    setSelectedType('Residential');
    setSelectedLocation('');
    setSelectedPriceRange('');
    setFilteredProperties(allProperties);
    setShowFiltered(false);
    setShowAllProperties(false);
    setProperties(allProperties.slice(0, 4));
  };

  const handlePropertyClick = (property: typeof allProperties[0]) => {
    setSelectedProperty(property);
    setIsPropertyDetailsOpen(true);
  };

  const handleViewAllClick = () => {
    setShowAllProperties(true);
    setFilteredProperties(allProperties);
    setShowFiltered(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section id="properties" ref={sectionRef} className="section-container px-4 sm:px-6 md:px-8">
      <div className={cn(
        "transition-all duration-700 delay-100", 
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Badge className="bg-Nestora-blue/10 text-Nestora-blue hover:bg-Nestora-blue/20 mb-4">
              Featured Properties
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Discover Our Premium Selection</h2>
            <p className="text-gray-600 max-w-2xl">
              Explore our handpicked collection of exclusive properties, designed to meet your highest expectations and lifestyle needs.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-wrap gap-4">
            <Link to="/wishlist">
              <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full group">
                My Wishlist
                <Heart className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <SearchPanel 
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          selectedPriceRange={selectedPriceRange}
          setSelectedPriceRange={setSelectedPriceRange}
          handleSearch={handleSearch}
          handleResetFilters={handleResetFilters}
          showFiltered={showFiltered}
          filteredPropertiesCount={filteredProperties.length}
        />

        {showFiltered || showAllProperties ? (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
              {showFiltered ? "Search Results" : "All Properties"}
            </h3>
            <PropertyList 
              properties={filteredProperties}
              isVisible={isVisible}
              showFiltered={showFiltered}
              showAllProperties={showAllProperties}
              handleResetFilters={handleResetFilters}
              handlePropertyClick={handlePropertyClick}
              handleViewAllClick={handleViewAllClick}
            />
          </div>
        ) : (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Featured Properties</h3>
            <PropertyList 
              properties={properties}
              isVisible={isVisible}
              showFiltered={showFiltered}
              showAllProperties={showAllProperties}
              handleResetFilters={handleResetFilters}
              handlePropertyClick={handlePropertyClick}
              handleViewAllClick={handleViewAllClick}
            />
          </div>
        )}
      </div>

      <PropertyDetails 
        property={selectedProperty}
        isOpen={isPropertyDetailsOpen}
        onClose={() => setIsPropertyDetailsOpen(false)}
      />
    </section>
  );
};

export default FeaturedProperties;
