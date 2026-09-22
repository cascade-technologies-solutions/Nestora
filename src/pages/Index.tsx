import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Footer from '@/components/Footer';
import PropertyDetails from '@/components/PropertyDetails';
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
  MessageSquare, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Users, 
  MessageCircle,
  Building,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist, WishlistProperty } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [projectsList, setProjectsList] = useState<AdminProject[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [homepageCMS, setHomepageCMS] = useState<HomepageCMS | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();

  useEffect(() => {
    setIsVisible(true);
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
    <div className="min-h-screen bg-white overflow-hidden">
      <Header />
      
      <main>
        {/* SECTION 1 — HERO */}
        <Hero />

        {/* SECTION 2 — COMPANY INTRODUCTION */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-7 space-y-6">
                <Badge className="bg-Nestora-blue/10 text-Nestora-blue hover:bg-Nestora-blue/20">
                  Company Introduction
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold font-display text-Nestora-dark">
                  {homepageCMS?.aboutHeading || "Complete Solutions. One Trusted Team."}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {homepageCMS?.aboutText1 || "Nestora handles multi-service technical works across renovation, repair, construction, waterproofing, metal fabrication, earthmoving, and property support services. We offer complete project execution and property assistance under one roof, backed by an execution-focused engineering team."}
                </p>
                <p className="text-gray-600 leading-relaxed font-light">
                  {homepageCMS?.aboutText2 || "We eliminate coordination challenges by unifying construction management, quality-oriented material selections, and municipal process assistance, ensuring your project is completed with transparency."}
                </p>
                <div className="pt-2">
                  <Link to="/about">
                    <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full">
                      Learn More About Us <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 rounded-2xl overflow-hidden shadow-lg h-96">
                <img 
                  src={homepageCMS?.aboutImage || "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                  alt="Engineering coordination on site" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — SERVICES */}
        <Services />

        {/* SECTION 4 — WHY CHOOSE US */}
        <section className="py-20 bg-gray-50 border-t border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="bg-Nestora-blue/10 text-Nestora-blue">Why Choose Us</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-Nestora-dark mt-4">Why Clients Trust Nestora</h2>
              <p className="text-gray-500 mt-2">
                We combine structural expertise, site management, and localized operational processes to deliver projects without delays.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-subtle">
                <h3 className="text-xl font-bold mb-3 text-Nestora-dark flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  Multiple Services Under One Roof
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Say goodbye to juggling multiple contractors. We manage construction, structural waterproofing, custom metal fabrication, site levelling, and official works.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-subtle">
                <h3 className="text-xl font-bold mb-3 text-Nestora-dark flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  Execution-Focused Team
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Our division leads and site supervisors coordinate with client engineers to execute tasks strictly according to safety and design standards.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-subtle">
                <h3 className="text-xl font-bold mb-3 text-Nestora-dark flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  Transparent Communication
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We supply milestone-based documentation, billing transparencies, and routine onsite updates so you always remain in the loop.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-subtle">
                <h3 className="text-xl font-bold mb-3 text-Nestora-dark flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  Quality-Oriented Work
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  From choosing waterproofing chemical layers to structural steel framing grades, we follow rigorous technical specifications.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-subtle">
                <h3 className="text-xl font-bold mb-3 text-Nestora-dark flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  End-to-End Project Support
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We stand by you from first requirements discussion and layout blueprints, through excavation and fabrication, to municipal documentation.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-subtle">
                <h3 className="text-xl font-bold mb-3 text-Nestora-dark flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  Local Project Understanding
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We understand regional soil conditions, local rain patterns (essential for waterproofing), material supply networks, and local processes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — FEATURED PROJECTS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
              <div>
                <Badge className="bg-Nestora-blue/10 text-Nestora-blue">Featured Works</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-Nestora-dark mt-4">Our Recent Engineering Works</h2>
                <p className="text-gray-500 mt-2">Check out our latest construction, waterproofing, and renovation projects.</p>
              </div>
              <Link to="/projects" className="mt-4 md:mt-0">
                <Button variant="outline" className="border-Nestora-blue text-Nestora-blue hover:bg-Nestora-blue/5 rounded-full">
                  View All Projects <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectsList.slice(0, 3).map((project) => (
                <div key={project.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-subtle flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                  <div>
                    <div className="h-48 overflow-hidden relative">
                      <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-Nestora-dark/80 text-white uppercase text-xs tracking-wider border-none px-2 py-0.5">
                          {project.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-600 text-white text-xs border-none px-2 py-0.5">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-Nestora-dark mb-1 leading-snug">{project.title}</h3>
                      <div className="flex items-center text-gray-400 text-xs mb-3">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>{project.location}</span>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">{project.description}</p>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <Link to="/contact">
                      <Button variant="outline" size="sm" className="w-full border-Nestora-blue/20 text-Nestora-blue text-xs hover:bg-Nestora-blue/5">
                        Enquire About Similar Project
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 — REAL ESTATE */}
        <section className="py-20 bg-gray-50 border-t border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
              <div>
                <Badge className="bg-Nestora-blue/10 text-Nestora-blue">Property Division</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-Nestora-dark mt-4">Explore Property Opportunities</h2>
                <p className="text-gray-500 mt-2">
                  Browse verified listings, commercial layouts, and plot sites managed under our property division.
                </p>
              </div>
              <Link to="/real-estate" className="mt-4 md:mt-0">
                <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full">
                  Explore Real Estate <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.slice(0, 3).map((property) => {
                const isFavorite = isInWishlist(property.id);
                return (
                  <div 
                    key={property.id} 
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-subtle hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div>
                      <div className="h-48 overflow-hidden relative">
                        <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 flex gap-1">
                          <Badge className="bg-Nestora-blue text-white text-xs border-none uppercase tracking-wide">
                            {property.type}
                          </Badge>
                          <Badge className="bg-gray-800 text-white text-xs border-none uppercase tracking-wide">
                            {property.category}
                          </Badge>
                        </div>
                        <button 
                          className={cn(
                            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                            isFavorite ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                          )}
                          onClick={(e) => handleToggleWishlist(e, property)}
                        >
                          <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-bold text-Nestora-dark line-clamp-1">{property.title}</h3>
                        <div className="flex items-center text-gray-400 text-xs mb-3 mt-1">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{property.address}</span>
                        </div>
                        <div className="text-Nestora-blue font-bold text-lg">{property.price}</div>
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-2 border-t border-gray-50 flex justify-between text-xs text-gray-400">
                      <span>{property.beds} Bed{property.beds !== 1 ? 's' : ''}</span>
                      <span>{property.baths} Bath{property.baths !== 1 ? 's' : ''}</span>
                      <span>{property.sqft} sqft</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 7 — WORK PROCESS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="bg-Nestora-blue/10 text-Nestora-blue">Project Workflow</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-Nestora-dark mt-4">Simple Project Process</h2>
              <p className="text-gray-500 mt-2">
                We handle our engineering, fabrication, and structural works through a systematic 5-step operational pipeline.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              <ProcessStep 
                num="1" 
                title="Discuss Requirement" 
                desc="Initial client consultation to scope out works, blueprints, and general budgets."
              />
              <ProcessStep 
                num="2" 
                title="Site Visit &amp; Assessment" 
                desc="Physical inspection of site layout, structural cracks, seepage depths, or boundary lines."
              />
              <ProcessStep 
                num="3" 
                title="Planning &amp; Proposal" 
                desc="Coordinating engineering drafts, materials specifications, milestone sheets, and transparent proposals."
              />
              <ProcessStep 
                num="4" 
                title="Execution" 
                desc="Engaging construction crews, waterproofing layers application, or structural fabrication under engineering guidance."
              />
              <ProcessStep 
                num="5" 
                title="Project Completion" 
                desc="Quality verification, site clearances, official documentation coordination, and project handover."
              />
            </div>
          </div>
        </section>

        {/* SECTION 8 — WHATSAPP COMMUNITY */}
        <section className="py-16 bg-Nestora-dark text-white">
          <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
            <div className="bg-white/10 rounded-full p-3 max-w-fit mx-auto">
              <MessageCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold font-display">Stay Connected With Us</h2>
            <p className="text-gray-300 max-w-xl mx-auto font-light text-sm md:text-base">
              Join our WhatsApp community for project updates, property opportunities and company announcements.
            </p>
            
            <div className="pt-2">
              {(settings?.whatsappCommunityUrl || CONFIG.WHATSAPP_COMMUNITY_URL) ? (
                <a 
                  href={settings?.whatsappCommunityUrl || CONFIG.WHATSAPP_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-6 flex items-center justify-center gap-2 mx-auto">
                    <MessageSquare size={18} />
                    Join WhatsApp Community
                  </Button>
                </a>
              ) : (
                <Button 
                  disabled
                  className="bg-gray-800 text-gray-400 rounded-full px-8 py-6 cursor-not-allowed mx-auto block"
                >
                  Community Coming Soon
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 9 — FINAL CTA */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-Nestora-dark">Planning a Project?</h2>
            <p className="text-gray-500 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
              Tell us what you're planning. Our team will understand your requirements and help identify the right solution.
            </p>
            <div className="pt-4 flex justify-center gap-4 flex-wrap">
              <Link to="/contact">
                <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full px-8 py-6">
                  Discuss Your Project
                </Button>
              </Link>
              
              {whatsappActive && (
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 rounded-full px-8 py-6 flex items-center gap-2">
                    <Phone size={16} />
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

      <Footer />
    </div>
  );
};

const ProcessStep = ({ num, title, desc }: { num: string; title: string; desc: string }) => {
  return (
    <div className="relative bg-white rounded-xl p-6 border border-gray-100 shadow-subtle flex flex-col justify-between h-full z-10">
      <div>
        <div className="w-8 h-8 rounded-full bg-Nestora-blue text-white flex items-center justify-center font-bold text-sm mb-4">
          {num}
        </div>
        <h4 className="font-bold text-sm text-Nestora-dark mb-2 font-display">{title}</h4>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed mt-2">{desc}</p>
    </div>
  );
};

export default Index;
