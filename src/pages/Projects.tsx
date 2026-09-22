import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, CheckCircle, Clock, Hammer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { projectRepository } from '@/admin/repositories/projectRepository';
import type { AdminProject } from '@/admin/types/admin';

const categories = ['All', 'Construction', 'Renovation', 'Waterproofing', 'Fabrication', 'Earthworks'];

const ProjectsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AdminProject[]>([]);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    projectRepository.getPublished().then(data => {
      setProjects(data);
      setFilteredProjects(data);
    });
  }, []);

  useEffect(() => {
    setAnimate(false);
    setTimeout(() => {
      let filtered = [...projects];
      if (selectedCategory !== 'All') {
        filtered = projects.filter(
          (project) => project.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      setFilteredProjects(filtered);
      setAnimate(true);
    }, 150);
  }, [selectedCategory, projects]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        {/* Hero Banner */}
        <section className="relative py-20 bg-Nestora-dark text-white overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="Projects portfolio background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 md:px-12 text-center">
            <Badge className="bg-white/10 text-white hover:bg-white/20 mb-4 border-none">
              Project Showcase
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display">
              Our Completed &amp; Ongoing Works
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto font-light">
              Explore concrete examples of our execution capabilities across renovation, waterproofing, site works, and construction.
            </p>
          </div>
        </section>

        {/* Filter Navigation */}
        <section className="py-8 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "rounded-full px-6 transition-all duration-250",
                  selectedCategory === category
                    ? "bg-Nestora-blue hover:bg-Nestora-blue/90 text-white shadow-sm"
                    : "bg-white hover:bg-gray-100 text-Nestora-dark border border-gray-200"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No projects match the selected category.</p>
              </div>
            ) : (
              <div className={cn(
                "grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500",
                animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h3 className="text-2xl md:text-3xl font-bold text-Nestora-dark mb-4">Planning a Project of Your Own?</h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Our site engineers and coordinators are available to discuss site specifications, planning proposals, and structural audits.
            </p>
            <Link to="/contact">
              <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full px-8 py-6">
                Discuss Your Project <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const ProjectCard = ({ project }: { project: Project }) => {
  const isCompleted = project.status === 'Completed';

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-subtle hover:shadow-md transition-all flex flex-col h-full">
      <div className="relative h-56 overflow-hidden">
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-Nestora-dark/80 text-white text-xs font-semibold px-3 py-1 uppercase tracking-wider border-none">
            {project.category}
          </Badge>
        </div>
        <div className="absolute top-4 right-4">
          <Badge className={cn(
            "text-xs font-semibold px-3 py-1 flex items-center gap-1 border-none",
            isCompleted 
              ? "bg-green-600 text-white" 
              : project.status === 'In Progress'
                ? "bg-amber-500 text-white"
                : "bg-blue-500 text-white"
          )}>
            {isCompleted ? <CheckCircle size={12} /> : <Clock size={12} />}
            {project.status}
          </Badge>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-Nestora-dark mb-2 font-display leading-snug">{project.title}</h3>
          
          <div className="flex items-center text-gray-400 text-xs mb-4">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{project.location}</span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">{project.description}</p>
        </div>

        <Link to="/contact" className="mt-auto">
          <Button variant="outline" className="w-full border-Nestora-blue/20 text-Nestora-blue hover:bg-Nestora-blue/5 rounded-lg flex items-center justify-center gap-1.5">
            <Hammer size={14} />
            Enquire About This Work
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProjectsPage;
