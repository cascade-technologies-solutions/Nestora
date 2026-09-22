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
            "text-3xl md:text-4xl font-bold mb-4 transition-all duration-700 delay-100",
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
            <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full px-8 py-6">
              Learn More About Services
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
  const { title, description, icon, color } = service;
  const Icon = iconMap[icon] || Wrench;

  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-6 hover:shadow-md transition-all duration-500 border border-gray-100 flex flex-col justify-between h-full",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-5`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-Nestora-dark">{title}</h3>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{description}</p>
      </div>
      <Link to="/services">
        <Button 
          variant="link" 
          className="p-0 h-auto text-Nestora-blue hover:text-Nestora-accent group w-fit justify-start"
        >
          Explore Details <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  );
};

export default Services;