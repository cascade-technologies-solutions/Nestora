import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { isWhatsAppEnabled, getWhatsAppLink } from '@/config';
import { servicesRepository } from '@/admin/repositories/servicesRepository';
import type { AdminService } from '@/admin/types/admin';

const ServicesPage = () => {
  const [services, setServices] = useState<AdminService[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    servicesRepository.getEnabled().then(setServices);
  }, []);

  const whatsappActive = isWhatsAppEnabled();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        {/* Services Page Header */}
        <section className="relative py-20 bg-Nestora-dark text-white overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="Services background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 md:px-12 text-center">
            <Badge className="bg-white/10 text-white hover:bg-white/20 mb-4 border-none">
              Services Portfolio
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display">
              Our Professional Divisions
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto font-light">
              Engineering, contracting, and property support divisions serving residential, commercial, and land development projects.
            </p>
          </div>
        </section>

        {/* Services Detail List */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="space-y-24">
              {services.map((service, index) => {
                const isEven = index % 2 === 0;
                const whatsappUrl = whatsappActive ? getWhatsAppLink(`Hello, I am interested in details regarding ${service.title}.`) : "#";

                return (
                  <div 
                    key={service.id} 
                    id={service.id}
                    className="grid md:grid-cols-12 gap-12 items-start"
                  >
                    {/* Visual block */}
                    <div className={`md:col-span-5 ${isEven ? 'md:order-1' : 'md:order-2'} rounded-2xl overflow-hidden shadow-md h-80`}>
                      {service.image ? (
                        <img 
                          src={service.image} 
                          alt={service.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-150 flex items-center justify-center text-gray-400">
                          No Image Uploaded
                        </div>
                      )}
                    </div>

                    {/* Text block */}
                    <div className={`md:col-span-7 ${isEven ? 'md:order-2' : 'md:order-1'} flex flex-col justify-center`}>
                      <h2 className="text-3xl font-bold mb-4 text-Nestora-dark font-display">{service.title}</h2>
                      <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                      
                      {service.workTypes && service.workTypes.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-sm font-semibold uppercase text-Nestora-blue tracking-wider mb-3">Key Work Types:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {service.workTypes.map((type, idx) => (
                              <div key={idx} className="flex items-center text-gray-600 text-sm">
                                <CheckCircle2 className="h-4 w-4 mr-2 text-Nestora-blue flex-shrink-0" />
                                <span>{type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 items-center">
                        <Link to="/contact">
                          <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full">
                            Discuss Your Project <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        {whatsappActive && (
                          <a 
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 rounded-full flex items-center gap-2">
                              <Phone size={16} />
                              WhatsApp Us
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicesPage;
