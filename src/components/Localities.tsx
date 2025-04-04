import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const localities = [
  {
    id: 1,
    name: "Vidyanagar",
    price: "Starting at ₹1.2M",
    properties: 24,
    image: "https://images.unsplash.com/photo-1518481852452-9415dscf0e3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: 2,
    name: "Keshwapur",
    price: "Starting at ₹850K",
    properties: 16,
    image: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "Deshpande Nagar",
    price: "Starting at ₹950K",
    properties: 21,
    image: "https://images.unsplash.com/photo-1573059756025-0038d4ffcbe2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80",
  },
  {
    id: 4,
    name: "Navanagar",
    price: "Starting at ₹1.5M",
    properties: 12,
    image: "https://images.unsplash.com/photo-1574259392081-dbd30e96bda7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=765&q=80",
  },
  {
    id: 5,
    name: "Unkal",
    price: "Starting at ₹1.1M",
    properties: 9,
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Gokul Road",
    price: "Starting at ₹2.2M",
    properties: 7,
    image: "https://images.unsplash.com/photo-1483401757487-2ced3fa77952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80",
  },
];


const Localities = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleViewAllLocalities = () => {
    navigate('/localities');
  };

  return (
    <section id="localities" ref={sectionRef} className="section-container">
      <div className={cn(
        "text-center max-w-3xl mx-auto mb-16 transition-all duration-700", 
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        <Badge className="bg-Nestora-blue/10 text-Nestora-blue hover:bg-Nestora-blue/20 mb-4">
          Popular Localities
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Explore Premium Locations
        </h2>
        <p className="text-gray-600">
          Discover the most sought-after neighborhoods and communities, each offering unique charm, 
          amenities, and investment potential.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {localities.map((locality, index) => (
          <LocalityCard 
            key={locality.id} 
            locality={locality} 
            isVisible={isVisible}
            delay={index * 100 + 200}
          />
        ))}
      </div>

      <div className={cn(
        "mt-12 text-center transition-all duration-700 delay-700", 
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        
       <Button 
          className="bg-Nestora-blue hover:bg-Nestora-accent text-white rounded-full px-8 py-6"
          onClick={handleViewAllLocalities}
        >
          View All Localities <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
};

interface LocalityCardProps {
  locality: typeof localities[0];
  isVisible: boolean;
  delay: number;
}

const LocalityCard = ({ locality, isVisible, delay }: LocalityCardProps) => {
  const navigate = useNavigate();

  const handleViewLocality = () => {
    // Navigate to properties page with location filter
    navigate(`/properties?location=${locality.name}`);
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl h-80 transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `₹{delay}ms` }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 img-hover-zoom">
        <img 
          src={locality.image || "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
          alt={locality.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold mb-1">{locality.name}</h3>
            <p className="text-sm opacity-80">{locality.price}</p>
            <p className="text-xs opacity-70">{locality.properties} properties</p>
          </div>
          <Button 
            className="bg-white hover:bg-gray-100 text-Nestora-dark rounded-full w-10 h-10 p-0 flex items-center justify-center"
            onClick={handleViewLocality}
            aria-label={`View ₹{locality.name}`}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Localities;
