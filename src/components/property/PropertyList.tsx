import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import PropertyCard from './PropertyCard';
import { allProperties } from '@/data/properties';

interface PropertyListProps {
  properties: typeof allProperties;
  isVisible: boolean;
  showFiltered: boolean;
  showAllProperties: boolean;
  handleResetFilters: () => void;
  handlePropertyClick: (property: typeof allProperties[0]) => void;
  handleViewAllClick: () => void;
}

const PropertyList = ({ 
  properties, 
  isVisible, 
  showFiltered, 
  showAllProperties, 
  handleResetFilters, 
  handlePropertyClick,
  handleViewAllClick 
}: PropertyListProps) => {
  
  if (properties.length === 0 && (showFiltered || showAllProperties)) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <h4 className="text-xl font-medium mb-2">No properties found</h4>
        <p className="text-gray-500 mb-6">Try adjusting your search filters to find properties.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            onClick={handleResetFilters} 
            className="bg-Nestora-blue hover:bg-Nestora-blue/90"
          >
            Clear Filters
          </Button>
          <Button 
            onClick={handleViewAllClick}
            className="bg-white hover:bg-gray-50 text-Nestora-dark border border-gray-200 rounded-full group hover:text-Nestora-blue"
          >
            View All Properties
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button 
          onClick={handleViewAllClick} 
          className="bg-white hover:bg-gray-50 text-Nestora-dark border border-gray-200 rounded-full group hover:text-Nestora-blue"
        >
          View All Properties
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {properties.map((property, index) => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            isVisible={isVisible}
            delay={index * 100}
            onClick={() => handlePropertyClick(property)}
          />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
