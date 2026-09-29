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

        {/* SECTION 2 — CORE SERVICES */}
        <Services />

        {/* SECTION 3 — ABOUT COMPANY */}
        <section className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 rounded-none overflow-hidden shadow-2xl h-[500px] border border-gray-100">
                <img 
                  src={homepageCMS?.aboutImage || "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                  alt="Engineering coordination on site" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="order-1 md:order-2 space-y-8">
                <div>
                  <Badge className="bg-Nestora-dark text-Nestora-accent tracking-widest uppercase mb-4 text-xs font-bold rounded-none px-3 py-1">
                    About Nestora
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-extrabold font-display leading-tight text-Nestora-dark">
                    {homepageCMS?.aboutHeading || "Complete Solutions. One Trusted Team."}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {homepageCMS?.aboutText1 || "Nestora handles multi-service technical works across renovation, repair, construction, waterproofing, metal fabrication, earthmoving, and property support services. We offer complete project execution and property assistance under one roof, backed by an execution-focused engineering team."}
                  </p>
                  <p className="text-gray-500 leading-relaxed">
                    {homepageCMS?.aboutText2 || "We eliminate coordination challenges by unifying construction management, quality-oriented material selections, and municipal process assistance, ensuring your project is completed with transparency."}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <Link to="/about">
                    <Button className="bg-Nestora-blue hover:bg-blue-800 text-white rounded-none px-8 py-6 font-bold uppercase tracking-wider text-sm transition-transform hover:-translate-y-1 shadow-md">
                      Learn More About Us <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — FEATURED PROJECTS */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-extrabold font-display text-Nestora-dark">Featured Projects</h2>
                <p className="text-gray-500 mt-4 text-lg">Excellence in construction, renovation, and structural engineering across our latest portfolio.</p>
              </div>
              <Link to="/projects">
                <Button variant="outline" className="border-Nestora-dark text-Nestora-dark hover:bg-Nestora-dark hover:text-white rounded-none font-bold uppercase tracking-wide px-6 py-6 transition-colors">
                  View All Projects <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectsList.slice(0, 3).map((project) => (
                <div 
                  key={project.id} 
                  className="bg-white rounded-none overflow-hidden group shadow-lg border border-gray-200 cursor-pointer flex flex-col h-full"
                  onClick={() => {
                    setSelectedProject(project);
                    setIsProjectDetailsOpen(true);
                  }}
                >
                  <div className="h-64 overflow-hidden relative">
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-Nestora-dark text-Nestora-accent uppercase text-xs font-bold tracking-wider rounded-none px-3 py-1">
                        {project.category}
                      </Badge>
                      <Badge className="bg-white text-Nestora-dark uppercase text-xs font-bold tracking-wider rounded-none px-3 py-1">
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center text-Nestora-blue font-bold text-xs uppercase tracking-wider mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{project.location}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold font-display text-Nestora-dark mb-4 group-hover:text-Nestora-blue transition-colors line-clamp-2 leading-tight">
                      {project.title}
                    </h3>
                    <div className="pt-6 mt-auto border-t border-gray-100 flex items-center justify-between pointer-events-none">
                      <div className="text-sm font-bold text-Nestora-dark uppercase tracking-wider flex items-center w-full group-hover:justify-between transition-all">
                        View Project Details <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5 — REAL ESTATE */}
        <section className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-extrabold font-display text-Nestora-dark">Real Estate Properties</h2>
                <p className="text-gray-500 mt-4 text-lg">
                  Browse verified listings, commercial spaces, and premium sites managed by our property division.
                </p>
              </div>
              <Link to="/real-estate">
                <Button className="bg-Nestora-blue hover:bg-blue-800 text-white rounded-none font-bold uppercase tracking-wide px-8 py-6 transition-transform hover:-translate-y-1 shadow-md">
                  Explore Properties <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.slice(0, 3).map((property) => {
                const isFavorite = isInWishlist(property.id);
                return (
                  <div 
                    key={property.id} 
                    className="bg-gray-50 rounded-none overflow-hidden border border-gray-200 shadow-md hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div className="h-64 overflow-hidden relative">
                      <img src={property.image} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge className="bg-Nestora-blue text-white uppercase text-xs font-bold tracking-wider rounded-none px-3 py-1 w-max">
                          {property.type}
                        </Badge>
                        <Badge className="bg-Nestora-dark text-white uppercase text-xs font-bold tracking-wider rounded-none px-3 py-1 w-max">
                          {property.category}
                        </Badge>
                      </div>
                      <button 
                        className={cn(
                          "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                          isFavorite ? "bg-red-500 text-white" : "bg-white text-Nestora-dark hover:bg-gray-100"
                        )}
                        onClick={(e) => handleToggleWishlist(e, property)}
                      >
                        <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="text-Nestora-blue font-extrabold text-xl mb-2">{property.price}</div>
                      <h3 className="text-lg font-bold font-display text-Nestora-dark line-clamp-1 mb-2 group-hover:text-Nestora-blue transition-colors">{property.title}</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-6">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{property.address}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <span className="block text-Nestora-dark font-bold">{property.beds}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">Beds</span>
                        </div>
                        <div className="text-center border-l border-r border-gray-200">
                          <span className="block text-Nestora-dark font-bold">{property.baths}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">Baths</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-Nestora-dark font-bold">{property.sqft}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">Sqft</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 6 — WHY CHOOSE US */}
        <section className="py-24 bg-Nestora-dark text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-16 md:flex justify-between items-end">
              <div className="md:w-1/2">
                <Badge className="bg-white/10 text-Nestora-accent tracking-widest uppercase mb-4 text-xs font-bold rounded-none px-3 py-1">
                  Why Choose Nestora
                </Badge>
                <h2 className="text-4xl md:text-5xl font-extrabold font-display leading-tight mb-6">Built on Quality,<br/>Driven by Trust.</h2>
              </div>
              <div className="md:w-1/2">
                <p className="text-gray-300 text-lg leading-relaxed">
                  We combine structural expertise, site management, and localized operational processes to deliver projects on time and without compromise.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 mt-20">
              <div className="border-t border-gray-700 pt-6">
                <CheckCircle2 className="h-8 w-8 text-Nestora-accent mb-6" />
                <h3 className="text-xl font-bold font-display mb-3">Multi-Service Solutions</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Say goodbye to juggling contractors. We manage construction, structural waterproofing, custom fabrication, and site levelling.
                </p>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <CheckCircle2 className="h-8 w-8 text-Nestora-accent mb-6" />
                <h3 className="text-xl font-bold font-display mb-3">Execution-Focused Team</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our division leads and site supervisors coordinate with engineers to execute tasks strictly according to safety and design standards.
                </p>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <CheckCircle2 className="h-8 w-8 text-Nestora-accent mb-6" />
                <h3 className="text-xl font-bold font-display mb-3">Transparent Communication</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  We supply milestone documentation, billing transparencies, and routine onsite updates so you always remain in the loop.
                </p>
              </div>
              
              <div className="border-t border-gray-700 pt-6">
                <CheckCircle2 className="h-8 w-8 text-Nestora-accent mb-6" />
                <h3 className="text-xl font-bold font-display mb-3">Quality Construction</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  From chemical waterproofing layers to structural steel grades, we follow rigorous technical specifications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — STRONG FINAL CTA */}
        <section className="py-24 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-5xl font-extrabold font-display text-Nestora-dark leading-tight">Have a Project in Mind?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-xl font-medium">
              Tell us what you're planning. Our team will understand your requirements and help identify the right solution.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/contact">
                <Button className="bg-Nestora-blue hover:bg-blue-800 text-white rounded-none px-10 py-8 font-bold uppercase tracking-wider text-base shadow-xl transition-transform hover:-translate-y-1 w-full sm:w-auto">
                  Request Enquiry
                </Button>
              </Link>
              
              {whatsappActive && (
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="border-gray-300 text-Nestora-dark hover:bg-gray-100 rounded-none px-10 py-8 font-bold uppercase tracking-wider text-base shadow-sm hover:shadow-md transition-all w-full sm:w-auto flex items-center gap-3">
                    <Phone size={20} className="text-Nestora-accent" />
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
