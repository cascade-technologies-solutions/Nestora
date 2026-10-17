import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Building2, 
  Hammer, 
  Wrench, 
  Truck, 
  ShieldCheck, 
  FileText, 
  Megaphone, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { servicesRepository } from '@/admin/repositories/servicesRepository';
import type { AdminService } from '@/admin/types/admin';

interface ServiceMeta {
  subtitle: string;
  pastelBg: string;
  borderColor: string;
  arrowBg: string;
  defaultImage: string;
  link: string;
  icon: React.ComponentType<any>;
}

const SERVICE_META_MAP: Record<string, ServiceMeta> = {
  'real-estate': {
    subtitle: 'Buy | Sell | Rent',
    pastelBg: '#E6F2FF',
    borderColor: '#CDE5FD',
    arrowBg: 'bg-[#1E88E5]',
    defaultImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
    link: '/real-estate',
    icon: Home,
  },
  'construction': {
    subtitle: 'Residential | Commercial',
    pastelBg: '#FFF8E6',
    borderColor: '#FDE8B5',
    arrowBg: 'bg-[#FB8C00]',
    defaultImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800',
    link: '/services#construction',
    icon: Building2,
  },
  'fabrication': {
    subtitle: 'Steel | Metal | Custom Work',
    pastelBg: '#E6FFE6',
    borderColor: '#C6F5C6',
    arrowBg: 'bg-[#43A047]',
    defaultImage: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800',
    link: '/services#fabrication',
    icon: Hammer,
  },
  'renovation': {
    subtitle: 'Modernize | Upgrade',
    pastelBg: '#FFE6E6',
    borderColor: '#FDC8C8',
    arrowBg: 'bg-[#E53935]',
    defaultImage: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800',
    link: '/services#renovation',
    icon: Hammer,
  },
  'repair-works': {
    subtitle: 'Home | Office | All Types',
    pastelBg: '#F2E6FF',
    borderColor: '#E3CBFD',
    arrowBg: 'bg-[#8E24AA]',
    defaultImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
    link: '/services#repair-works',
    icon: Wrench,
  },
  'packers-and-movers': {
    subtitle: 'Safe | Fast | Reliable',
    pastelBg: '#E6FFFA',
    borderColor: '#B8F2EC',
    arrowBg: 'bg-[#00ACC1]',
    defaultImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
    link: '/services#packers-and-movers',
    icon: Truck,
  },
  'security-services': {
    subtitle: 'Safety | Surveillance | Peace of Mind',
    pastelBg: '#FFF3E0',
    borderColor: '#FFE0B2',
    arrowBg: 'bg-[#FF9800]',
    defaultImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800',
    link: '/services#security-services',
    icon: ShieldCheck,
  },
  'documentation-and-approvals': {
    subtitle: 'Govt. Works | Forms | Certificates',
    pastelBg: '#E3F2FD',
    borderColor: '#BBDEFB',
    arrowBg: 'bg-[#1E88E5]',
    defaultImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800',
    link: '/services#documentation-and-approvals',
    icon: FileText,
  },
  'property-ads': {
    subtitle: 'Post | Find | Sell | Buy',
    pastelBg: '#FFE6F0',
    borderColor: '#F8BBD0',
    arrowBg: 'bg-[#D81B60]',
    defaultImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
    link: '/services#property-ads',
    icon: Megaphone,
  },
};

// Fallback seed list for instant rendering and resilient offline operations
const DEFAULT_9_SERVICES: AdminService[] = [
  {
    id: 'real-estate',
    title: 'Real Estate',
    description: 'Comprehensive property search, verified titles, buying, selling, and rental advisory across Hubli-Dharwad.',
    icon: 'Home',
    color: 'bg-blue-500',
    enabled: true,
    order: 1,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Buy residential plots', 'Sell properties', 'Commercial leasing', 'Rental management', 'Title verification']
  },
  {
    id: 'construction',
    title: 'Construction',
    description: 'Turnkey residential and commercial construction with structural engineering, site supervision, and milestone delivery.',
    icon: 'Building',
    color: 'bg-amber-500',
    enabled: true,
    order: 2,
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Residential construction', 'Commercial construction', 'Civil works', 'Structural engineering', 'Turnkey execution']
  },
  {
    id: 'fabrication',
    title: 'Fabrication',
    description: 'Custom structural steel, architectural metalwork, industrial frames, safety barriers, and precision metal fabrication.',
    icon: 'Hammer',
    color: 'bg-emerald-500',
    enabled: true,
    order: 3,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Steel structures', 'Metal fabrication', 'Custom gates & grills', 'Industrial frames', 'Architectural metal']
  },
  {
    id: 'renovation',
    title: 'Renovation',
    description: 'Complete home and commercial remodelling, layout restructuring, interior upgrades, and building restorations.',
    icon: 'Hammer',
    color: 'bg-rose-500',
    enabled: true,
    order: 4,
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Home remodelling', 'Office interior upgrades', 'Structural retrofitting', 'Space optimization', 'Facade restoration']
  },
  {
    id: 'repair-works',
    title: 'Repair Works',
    description: 'Electrical, plumbing, carpentry, waterproofing repairs, and general property maintenance for homes and offices.',
    icon: 'Wrench',
    color: 'bg-purple-500',
    enabled: true,
    order: 5,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Electrical repairs', 'Plumbing fixes', 'Carpentry & masonry', 'Seepage rectification', 'Routine maintenance']
  },
  {
    id: 'packers-and-movers',
    title: 'Packers And Movers',
    description: 'Professional household shifting, office relocation, secure packing, transit insurance, and hassle-free moving support.',
    icon: 'Truck',
    color: 'bg-cyan-500',
    enabled: true,
    order: 6,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Household shifting', 'Corporate relocation', 'Secure multi-layer packing', 'Vehicle transportation', 'Transit insurance']
  },
  {
    id: 'security-services',
    title: 'Security Services',
    description: 'CCTV installation, smart access control, digital surveillance setups, and round-the-clock premises protection.',
    icon: 'ShieldCheck',
    color: 'bg-orange-500',
    enabled: true,
    order: 7,
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800',
    workTypes: ['CCTV surveillance cameras', 'Smart door locks & biometric', 'Intercom & alarm systems', 'On-site security staffing', 'Annual maintenance']
  },
  {
    id: 'documentation-and-approvals',
    title: 'Documentation And Approvals',
    description: 'Khata registration, building plan sanctions, municipal approvals, title verification, and government certifications.',
    icon: 'FileText',
    color: 'bg-blue-600',
    enabled: true,
    order: 8,
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Khata transfer & extract', 'Building plan sanction', 'Encumbrance certificates (EC)', 'Title deed verification', 'RERA advisory']
  },
  {
    id: 'property-ads',
    title: 'Property Ads',
    description: 'Targeted property marketing, high-visibility digital advertising, buyer matching, and listing promotion across Hubli-Dharwad.',
    icon: 'Megaphone',
    color: 'bg-pink-500',
    enabled: true,
    order: 9,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
    workTypes: ['Digital property promotion', 'Premium yard & banner ads', 'Targeted buyer outreach', 'Social media ad campaigns', 'Lead verification']
  }
];

const Services = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [servicesList, setServicesList] = useState<AdminService[]>(DEFAULT_9_SERVICES);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    servicesRepository.getEnabled().then((data) => {
      if (data && data.length > 0) {
        setServicesList(data);
      }
    });

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
      className="py-16 md:py-24 bg-white"
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Badge className="bg-brand-blue/10 text-brand-navy hover:bg-brand-blue/20 mb-3 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
            Our Services
          </Badge>
          <h2 className={cn(
            "text-3xl md:text-5xl font-black font-display text-brand-navy mb-4 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            Complete Solutions. One Trusted Team.
          </h2>
          <p className={cn(
            "text-slate-600 text-base md:text-lg transition-all duration-700 delay-200 leading-relaxed",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            From real estate and property promotion to construction, renovation, repairs, and municipal approvals — everything you need in Hubli-Dharwad.
          </p>
        </div>

        {/* 3x3 Grid of 9 Reference Pastel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {[
            'real-estate',
            'construction',
            'fabrication',
            'renovation',
            'repair-works',
            'packers-and-movers',
            'security-services',
            'documentation-and-approvals',
            'property-ads'
          ].map((refId) => {
            const found = servicesList.find((s) => s.id.toLowerCase() === refId);
            return found || DEFAULT_9_SERVICES.find((s) => s.id === refId)!;
          }).filter(Boolean).map((service, index) => {
            const normalizedKey = service.id.toLowerCase();
            const meta = SERVICE_META_MAP[normalizedKey] || {
              subtitle: service.description?.slice(0, 40) || 'Verified Professional Service',
              pastelBg: '#F1F5F9',
              borderColor: '#E2E8F0',
              arrowBg: 'bg-brand-blue',
              defaultImage: service.image || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80',
              link: `/services#${service.id}`,
              icon: Building2,
            };

            const imageUrl = service.image || meta.defaultImage;
            const subtitle = meta.subtitle;

            return (
              <Link 
                key={service.id || index}
                to={meta.link}
                className={cn(
                  "group rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl border relative overflow-hidden",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ 
                  backgroundColor: meta.pastelBg,
                  borderColor: meta.borderColor,
                  transitionDelay: `${index * 50 + 100}ms` 
                }}
              >
                <div>
                  {/* Top Visual Area (Card Illustration / Image) */}
                  <div className="w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-white/70 shadow-xs mb-5 flex items-center justify-center p-2 relative">
                    <img 
                      src={imageUrl} 
                      alt={service.title}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-2xl sm:text-[26px] font-black text-brand-navy tracking-tight leading-snug group-hover:text-brand-blue transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 font-semibold text-sm sm:text-base mt-1.5 mb-2">
                    {subtitle}
                  </p>
                </div>

                {/* Bottom Row with Arrow Button */}
                <div className="pt-4 flex items-center justify-between border-t border-black/5 mt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/60 group-hover:text-brand-navy transition-colors">
                    View Details
                  </span>
                  <div className={cn(
                    "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-1",
                    meta.arrowBg
                  )}>
                    <ChevronRight className="h-6 w-6 stroke-[3]" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12 md:mt-16">
          <Link to="/services">
            <button className="bg-brand-navy hover:bg-slate-900 text-white font-extrabold rounded-full px-8 py-4 text-base shadow-md transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2">
              Explore All Services <ArrowRight className="h-5 w-5 stroke-[2.5]" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;