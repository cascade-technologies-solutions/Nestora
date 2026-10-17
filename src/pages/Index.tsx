import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Footer from '@/components/Footer';
import PropertyDetails from '@/components/PropertyDetails';
import ProjectDetails from '@/components/ProjectDetails';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CONFIG } from '@/config';
import { propertyRepository } from '@/admin/repositories/propertyRepository';
import { projectRepository } from '@/admin/repositories/projectRepository';
import type { AdminProperty, AdminProject } from '@/admin/types/admin';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { SiteSettings, HomepageCMS } from '@/admin/types/admin';
import { homepageRepository } from '@/admin/repositories/homepageRepository';
import { 
  CheckCircle2, 
  MapPin, 
  ArrowRight, 
  Phone,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist, WishlistProperty } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [projectsList, setProjectsList] = useState<AdminProject[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [homepageCMS, setHomepageCMS] = useState<HomepageCMS | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<AdminProject | null>(null);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    propertyRepository.getPublished().then(setProperties);
    settingsRepository.get().then(setSettings);
    homepageRepository.get().then(setHomepageCMS);
    projectRepository.getFeatured().then(setProjectsList);
  }, []);

  const handlePropertyClick = (property: AdminProperty) => {
    setSelectedProperty(property);
    setIsPropertyDetailsOpen(true);
  };

  const handleToggleWishlist = (e: React.MouseEvent, property: AdminProperty) => {
    e.stopPropagation();
    const isFavorite = isInWishlist(property.id);
    if (isFavorite) {
      removeFromWishlist(property.id);
      toast({
        title: "Removed from wishlist",
        description: `${property.title} removed.`
      });
    } else {
      addToWishlist(property as WishlistProperty);
      toast({
        title: "Added to wishlist",
        description: `${property.title} added to wishlist.`
      });
    }
  };

  const whatsappPhone = settings?.whatsapp?.trim() || CONFIG.WHATSAPP_PHONE;
  const whatsappActive = whatsappPhone.length > 0;
  const whatsappUrl = whatsappActive
    ? `https://wa.me/${whatsappPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(
        'Hello Nestora, I would like to inquire about your services.'
      )}`
    : '#';

  return (
    <div className="min-h-screen bg-white overflow-hidden text-Nestora-dark font-sans">
      <Header />
      
      <main>
        {/* SECTION 1 — HERO */}
        <Hero />

        {/* SECTION 2 — 3x3 SERVICES GRID */}
        <Services />

        {/* SECTION 3 — FEATURED REAL ESTATE PROPERTIES */}
        <section className="py-20 md:py-24 bg-slate-50/60 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
              <div className="max-w-2xl">
                <Badge className="bg-brand-blue/10 text-brand-navy mb-3 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
                  Featured Listings
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black font-display text-brand-navy">
                  Hubli-Dharwad Properties
                </h2>
                <p className="text-slate-600 mt-3 text-base md:text-lg">
                  Browse verified residential homes, commercial plots, and premium sites with complete title scrutiny.
                </p>
              </div>
              <Link to="/real-estate">
                <Button className="bg-brand-navy hover:bg-slate-900 text-white rounded-full font-bold px-7 py-6 text-sm shadow-sm transition-transform hover:-translate-y-0.5">
                  Explore All Properties <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {properties.slice(0, 3).map((property) => {
                const isFavorite = isInWishlist(property.id);
                return (
                  <div 
                    key={property.id} 
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div>
                      <div className="h-60 overflow-hidden relative">
                        <img 
                          src={property.image} 
                          alt={property.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                          <Badge className="bg-brand-blue text-white uppercase text-[11px] font-bold rounded-full px-3 py-1 shadow-xs">
                            {property.type}
                          </Badge>
                          <Badge className="bg-brand-navy text-white uppercase text-[11px] font-bold rounded-full px-3 py-1 shadow-xs">
                            {property.category}
                          </Badge>
                        </div>
                        <button 
                          className={cn(
                            "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110",
                            isFavorite ? "bg-red-500 text-white" : "bg-white/95 text-brand-navy backdrop-blur-xs hover:bg-white"
                          )}
                          onClick={(e) => handleToggleWishlist(e, property)}
                          aria-label="Save to wishlist"
                        >
                          <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <div className="p-6">
                        <div className="text-brand-blue font-black text-2xl mb-1.5">{property.price}</div>
                        <h3 className="text-xl font-bold font-display text-brand-navy line-clamp-1 mb-2 group-hover:text-brand-blue transition-colors">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-slate-500 text-sm mb-5">
                          <MapPin className="h-4 w-4 mr-1.5 text-brand-blue shrink-0" />
                          <span className="truncate">{property.address}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
                          <div>
                            <span className="block text-brand-navy font-black text-base">{property.beds}</span>
                            <span className="text-[11px] text-slate-500 uppercase font-semibold">Beds</span>
                          </div>
                          <div className="border-x border-slate-100">
                            <span className="block text-brand-navy font-black text-base">{property.baths}</span>
                            <span className="text-[11px] text-slate-500 uppercase font-semibold">Baths</span>
                          </div>
                          <div>
                            <span className="block text-brand-navy font-black text-base">{property.sqft}</span>
                            <span className="text-[11px] text-slate-500 uppercase font-semibold">Sqft</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4 — ABOUT US */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-3xl overflow-hidden shadow-xl h-[420px] md:h-[480px] border border-slate-100 relative group">
                <img 
                  src={homepageCMS?.aboutImage || "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                  alt="Nestora Team On Site" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-xs border border-white/40 shadow-lg">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-navy/70">Local Expertise</p>
                  <p className="text-sm font-extrabold text-brand-navy">Serving Hubli, Dharwad & Surrounding Regions</p>
                </div>
              </div>

              <div className="order-1 md:order-2 space-y-6">
                <div>
                  <Badge className="bg-brand-blue/10 text-brand-navy mb-3 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
                    About Nestora
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-black font-display leading-tight text-brand-navy">
                    {homepageCMS?.aboutHeading || "Complete Solutions. One Trusted Team."}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                    {homepageCMS?.aboutText1 || "Nestora handles multi-service technical works across renovation, repair, construction, waterproofing, metal fabrication, earthmoving, and property support services. We offer complete project execution and property assistance under one roof, backed by an execution-focused engineering team."}
                  </p>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                    {homepageCMS?.aboutText2 || "We eliminate coordination challenges by unifying construction management, quality-oriented material selections, and municipal process assistance, ensuring your project is completed with transparency."}
                  </p>
                </div>
                
                <div className="pt-2">
                  <Link to="/about">
                    <Button className="bg-brand-navy hover:bg-slate-900 text-white rounded-full px-8 py-6 font-bold text-sm transition-transform hover:-translate-y-0.5 shadow-md">
                      Learn More About Us <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — FEATURED PROJECTS */}
        <section className="py-20 md:py-24 bg-slate-50/60 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
              <div className="max-w-2xl">
                <Badge className="bg-brand-blue/10 text-brand-navy mb-3 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
                  Portfolio
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black font-display text-brand-navy">
                  Featured Projects
                </h2>
                <p className="text-slate-600 mt-3 text-base md:text-lg">
                  Excellence in construction, renovation, and structural engineering across our latest Hubli-Dharwad sites.
                </p>
              </div>
              <Link to="/projects">
                <Button variant="outline" className="border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white rounded-full font-bold px-7 py-6 text-sm transition-colors">
                  View All Projects <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {projectsList.slice(0, 3).map((project) => (
                <div 
                  key={project.id} 
                  className="bg-white rounded-3xl overflow-hidden group shadow-xs hover:shadow-xl border border-slate-200/80 cursor-pointer flex flex-col justify-between transition-all duration-300"
                  onClick={() => {
                    setSelectedProject(project);
                    setIsProjectDetailsOpen(true);
                  }}
                >
                  <div>
                    <div className="h-60 overflow-hidden relative">
                      <img 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-brand-navy text-brand-yellow uppercase text-[11px] font-bold rounded-full px-3 py-1 shadow-xs">
                          {project.category}
                        </Badge>
                        <Badge className="bg-white text-brand-navy uppercase text-[11px] font-bold rounded-full px-3 py-1 shadow-xs">
                          {project.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center text-brand-blue font-bold text-xs uppercase tracking-wider mb-2">
                        <MapPin className="h-4 w-4 mr-1 shrink-0" />
                        <span>{project.location}</span>
                      </div>
                      <h3 className="text-xl font-bold font-display text-brand-navy mb-3 group-hover:text-brand-blue transition-colors line-clamp-2 leading-tight">
                        {project.title}
                      </h3>
                      <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-navy uppercase tracking-wider pt-4">
                    <span>View Project Details</span>
                    <ArrowRight className="h-4 w-4 text-brand-blue group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 — WHY CHOOSE US */}
        <section className="py-20 md:py-24 bg-brand-navy text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="mb-14 md:flex justify-between items-end gap-10">
              <div className="md:w-1/2">
                <Badge className="bg-white/10 text-brand-yellow mb-3 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
                  Why Choose Nestora
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black font-display leading-tight">
                  Built on Quality,<br/>Driven by Trust.
                </h2>
              </div>
              <div className="md:w-1/2 mt-4 md:mt-0">
                <p className="text-slate-200 text-base md:text-lg leading-relaxed">
                  We combine structural expertise, site management, verified property listings, and localized municipal process assistance to deliver projects on time.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-8 w-8 text-brand-yellow mb-4" />
                <h3 className="text-lg font-bold font-display mb-2">Multi-Service Solutions</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Real estate, civil construction, fabrication, repairs, and moving support managed by one unified team.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-8 w-8 text-brand-yellow mb-4" />
                <h3 className="text-lg font-bold font-display mb-2">Execution-Focused Team</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Engineers and supervisors coordinating directly on-site to maintain quality and safety standards.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-8 w-8 text-brand-yellow mb-4" />
                <h3 className="text-lg font-bold font-display mb-2">Transparent Dealings</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Clear title scrutiny, itemized cost estimates, milestone documentation, and regular photo updates.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="h-8 w-8 text-brand-yellow mb-4" />
                <h3 className="text-lg font-bold font-display mb-2">Localized Expertise</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Deep familiarity with Hubli-Dharwad municipal processes, Khata registration, and zonal regulations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — FINAL CTA */}
        <section className="py-20 md:py-24 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-black font-display text-brand-navy leading-tight">
              Have a Property or Project in Mind?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-base md:text-lg">
              Tell us what you're planning. Our team will review your requirements and provide clear, reliable advice.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/contact" className="w-full sm:w-auto">
                <Button className="bg-brand-navy hover:bg-slate-900 text-white rounded-full px-8 py-6 font-bold text-base shadow-lg transition-transform hover:-translate-y-0.5 w-full">
                  Request an Enquiry
                </Button>
              </Link>
              
              {whatsappActive && (
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="bg-brand-yellow hover:bg-yellow-400 text-brand-navy rounded-full px-8 py-6 font-black text-base shadow-lg transition-transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2">
                    <Phone size={18} className="text-brand-navy stroke-[2.5]" />
                    WhatsApp Us
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <PropertyDetails 
        property={selectedProperty}
        isOpen={isPropertyDetailsOpen}
        onClose={() => setIsPropertyDetailsOpen(false)}
      />

      <ProjectDetails 
        project={selectedProject}
        isOpen={isProjectDetailsOpen}
        onClose={() => setIsProjectDetailsOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default Index;
