import React from 'react';
import { MapPin, Building, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from '@/lib/utils';

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

interface SearchPanelProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  selectedPriceRange: string;
  setSelectedPriceRange: (range: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  handleResetFilters: () => void;
  showFiltered: boolean;
  filteredPropertiesCount: number;
}

const SearchPanel = ({
  selectedType,
  setSelectedType,
  selectedLocation,
  setSelectedLocation,
  selectedPriceRange,
  setSelectedPriceRange,
  handleSearch,
  handleResetFilters,
  showFiltered,
  filteredPropertiesCount
}: SearchPanelProps) => {
  return (
    <div className="glass-panel rounded-lg sm:rounded-xl lg:rounded-2xl max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-12 shadow-subtle">
      <form onSubmit={handleSearch} className="p-4 sm:p-5 md:p-6">
        <div className="mb-4 sm:mb-6">
          <ToggleGroup 
            type="single" 
            value={selectedType} 
            onValueChange={(value) => value && setSelectedType(value)} 
            className="flex flex-wrap justify-center gap-2"
          >
            {propertyTypes.map((type) => (
              <ToggleGroupItem 
                key={type} 
                value={type}
                className={cn(
                  "px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200",
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
        
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="relative">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <select 
                  className="w-full appearance-none pl-10 pr-10 py-2 sm:py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-Nestora-blue text-sm"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">Choose any Location</option>
                  {hubliLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <select 
                  className="w-full appearance-none pl-10 pr-10 py-2 sm:py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-Nestora-blue text-sm"
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                >
                  <option value="">Choose any Price</option>
                  {priceRanges.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-lg h-10 sm:h-12"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
        
        {showFiltered && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-xs sm:text-sm text-gray-500">
              {filteredPropertiesCount === 0 
                ? "No properties match your search criteria."
                : `Showing ${filteredPropertiesCount} properties`
              }
            </p>
            <Button 
              type="button" 
              variant="ghost" 
              className="text-xs sm:text-sm h-7 sm:h-8 px-2"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchPanel;
