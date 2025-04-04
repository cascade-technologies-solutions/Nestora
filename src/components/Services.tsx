import { useState, useEffect, useRef } from 'react';
import { Home, Building, Briefcase, User, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const servicesData = [
  {
    id: 1,
    title: "Buying Property",
    description: "Find your dream property with our expert guidance through the entire buying process.",
    icon: Home,
    color: "bg-indigo-800",
  },
  {
    id: 2,
    title: "Selling Property",
    description: "Get the best value for your property with our strategic marketing and negotiation.",
    icon: Building,
    color: "bg-purple-700",
  },
  {
    id: 3,
    title: "Property Management",
    description: "Maximize your investment with our comprehensive property management services.",
    icon: Briefcase,
    color: "bg-violet-700",
  },
  {
    id: 4,
    title: "Investment Consulting",
    description: "Make informed decisions with our expert real Nestora investment consulting.",
    icon: User,
    color: "bg-indigo-700",
  }
];

const Services = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

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

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="services" 
      className="py-18 bg-gray-50"
      ref={sectionRef}
    >
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-Nestora-blue/10 text-Nestora-blue hover:bg-Nestora-blue/20 mb-4">
            Our Services
          </Badge>
          <h2 className={cn(
            "text-3xl md:text-4xl font-bold mb-4 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            Comprehensive Real Nestora Solutions
          </h2>
          <p className={cn(
            "text-gray-600 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            We offer a wide range of services to meet all your real Nestora needs, from finding your dream home to 
            maximizing your investment returns.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {servicesData.map((service, index) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              isVisible={isVisible}
              delay={index * 100 + 300}
              scrollToSection={scrollToSection}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  service: typeof servicesData[0];
  isVisible: boolean;
  delay: number;
  scrollToSection: (sectionId: string) => void;
}

const ServiceCard = ({ service, isVisible, delay, scrollToSection }: ServiceCardProps) => {
  const { title, description, icon: Icon, color } = service;

  const handleLearnMore = () => {
    scrollToSection('contact');
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-6 hover:shadow-md transition-all duration-500 border border-gray-100",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `₹{delay}ms` }}
    >
      <div className={`w-12 h-12 ₹{color} rounded-lg flex items-center justify-center mb-5`}>
        <Icon className="h-6 w-6 text-blue" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Button 
        variant="link" 
        className="p-0 h-auto text-Nestora-blue hover:text-Nestora-accent group"
        onClick={handleLearnMore}
      >
        Learn More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
};

export default Services;