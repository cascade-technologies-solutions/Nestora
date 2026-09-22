import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShieldCheck, HardHat, Compass, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* About Hero Section */}
        <section className="relative py-20 bg-Nestora-dark text-white overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="Engineering" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 md:px-12 text-center">
            <Badge className="bg-white/10 text-white hover:bg-white/20 mb-4 border-none">
              Company Profile
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display">
              About Nestora
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto font-light">
              Providing unified solutions in infrastructure, construction, waterproofing, fabrication, earthmoving, and real estate services.
            </p>
          </div>
        </section>

        {/* Company Introduction */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className={cn(
                "transition-all duration-700",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}>
                <Badge className="bg-Nestora-blue/10 text-Nestora-blue mb-4">
                  Who We Are
                </Badge>
                <h2 className="text-3xl font-bold mb-6 text-Nestora-dark">
                  Complete Solutions. One Trusted Team.
                </h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Nestora is an execution-focused multi-service organization built on the principles of engineering excellence, structural integrity, and local project understanding. We bridge the gap between complex engineering needs and real estate opportunities by housing specialist workflows under one unified management system.
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Whether developing new commercial infrastructure, renovating residential structures, preventing degradation through waterproofing, executing precision fabrication, clearing sites, or assisting with property documentation, we apply the same professional rigor to every undertaking.
                </p>
                <Link to="/services">
                  <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full">
                    Explore Our Divisions <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg h-96">
                <img 
                  src="https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Modern office architecture" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission and Vision */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-subtle flex flex-col justify-between">
                <div>
                  <Badge className="bg-blue-50 text-blue-700 mb-4 border-none">Our Mission</Badge>
                  <h3 className="text-2xl font-bold mb-4 text-Nestora-dark">Delivering Structural Excellence</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Our mission is to deliver dependable, high-quality project execution across construction, renovation, waterproofing, and fabrication. We seek to protect and maximize the value of our clients' property investments by providing clear, coordinated solutions with absolute transparency.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-subtle flex flex-col justify-between">
                <div>
                  <Badge className="bg-blue-50 text-blue-700 mb-4 border-none">Our Vision</Badge>
                  <h3 className="text-2xl font-bold mb-4 text-Nestora-dark">Establishing Trust on Every Site</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    We envision establishing ourselves as the region's most trusted partner for end-to-end site development, maintenance, and property services. We aim to achieve this by executing projects safely, on schedule, and in complete alignment with regional standards and client requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Approach & Capabilities */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="bg-Nestora-blue/10 text-Nestora-blue mb-4">Our Approach</Badge>
              <h2 className="text-3xl font-bold text-Nestora-dark mb-4">Operational Strengths</h2>
              <p className="text-gray-600">
                We design and execute our works with a structured, step-by-step methodology to ensure consistency, quality, and complete transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <ApproachCard 
                icon={<HardHat className="h-6 w-6 text-white" />}
                bg="bg-blue-600"
                title="Execution-Focused Team"
                description="We employ experienced site engineers, technicians, and fabrication specialists to supervise projects from excavation to handover."
              />
              <ApproachCard 
                icon={<ShieldCheck className="h-6 w-6 text-white" />}
                bg="bg-cyan-600"
                title="Quality-Oriented Work"
                description="We enforce strict material specifications and workmanship standards, ensuring structures are durable and waterproof."
              />
              <ApproachCard 
                icon={<Compass className="h-6 w-6 text-white" />}
                bg="bg-amber-600"
                title="End-to-End Support"
                description="We manage everything under one roof: design alignment, site visits, structural calculations, execution, and completion checks."
              />
              <ApproachCard 
                icon={<FileText className="h-6 w-6 text-white" />}
                bg="bg-violet-600"
                title="Transparent Coordination"
                description="We supply precise documentation, milestones, and photo/video progress reporting to keep our clients fully informed."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gray-50 border-t border-b border-gray-100">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h3 className="text-3xl font-bold text-Nestora-dark mb-4">Have an upcoming project in mind?</h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Our site engineers and property consultants are ready to assist. Share your requirements and schedule a site assessment.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/contact">
                <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full px-8 py-6">
                  Contact Our Team
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" className="rounded-full px-8 py-6">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const ApproachCard = ({ icon, bg, title, description }: { icon: React.ReactNode; bg: string; title: string; description: string }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-subtle hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-5`}>
        {icon}
      </div>
      <h4 className="text-lg font-bold mb-2 text-Nestora-dark">{title}</h4>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default About;
