import { useState, useEffect, useRef } from 'react';
import { Home, Building, ShieldCheck, Hammer, Truck, FileText, Wrench, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { servicesRepository } from '@/admin/repositories/servicesRepository';
import type { AdminService } from '@/admin/types/admin';

const iconMap: Record<string, React.ComponentType<any>> = {
  Building,
  Wrench,
  ShieldCheck,
  Hammer,
  Truck,
  Home,
  FileText
};

const Services = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [servicesList, setServicesList] = useState<AdminService[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    servicesRepository.getEnabled().then(setServicesList);

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
    <section 
      id="services" 
      className="py-20 bg-gray-50"
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-Nestora-blue/10 text-Nestora-blue hover:bg-Nestora-blue/20 mb-4">
            Our Services
          </Badge>
          <h2 className={cn(
            "text-3xl md:text-5xl font-extrabold font-display mb-6 transition-all text-Nestora-dark duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            Complete Solutions. One Trusted Team.
          </h2>
          <p className={cn(
            "text-gray-600 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            We handle projects across renovation, repair, construction, waterproofing, fabrication, earthmoving, and property-related support services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service, index) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              isVisible={isVisible}
              delay={index * 80 + 200}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/services">
            <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full px-8 py-6 text-base shadow-md">
              View All Services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  service: AdminService;
  isVisible: boolean;
  delay: number;
}

const ServiceCard = ({ service, isVisible, delay }: ServiceCardProps) => {
  const { title, description, image, color } = service;
  
  // Mapping titles to suitable fallback visual imagery
  const fallbackImages: Record<string, string> = {
    'Construction': 'https://images.unsplash.com/photo-1541888081622-19e34c2084c7?auto=format&fit=crop&q=80',
    'Renovation': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80',
    'Repair Works': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80',
    'Waterproofing': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80',
    'Fabrication': 'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?auto=format&fit=crop&q=80',
    'Earthworks': 'https://images.unsplash.com/photo-1578595460228-56eb0d1ae00b?auto=format&fit=crop&q=80',
    'Real Estate': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80',
  };
  
  const visualImage = image || fallbackImages[title] || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80';

  // Ensure soft colored background by providing a very light tint
  // For standard colors, we use bg-slate-50 if it's undefined
  const bgClass = color ? color.replace('500', '50').replace('600', '50') : 'bg-slate-50';

  return (
    <div 
      className={cn(
        "rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col justify-between h-full group",
        bgClass,
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div>
        <div className="h-56 overflow-hidden relative">
          <img 
            src={visualImage} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        </div>
        <div className="p-8 pb-4">
          <h3 className="text-2xl font-extrabold mb-3 text-Nestora-dark font-display">{title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="px-8 pb-8 pt-4">
        <Link to={`/services#${service.id}`} className="inline-block">
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-Nestora-blue group-hover:bg-Nestora-accent group-hover:text-Nestora-dark group-hover:border-transparent transition-all shadow-sm">
             <ArrowRight className="h-5 w-5" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Services;