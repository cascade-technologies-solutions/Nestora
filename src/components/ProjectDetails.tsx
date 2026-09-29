import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Clock, Calendar, Hammer, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import type { AdminProject } from '@/admin/types/admin';

interface ProjectDetailsProps {
  project: AdminProject | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectDetails = ({ project, isOpen, onClose }: ProjectDetailsProps) => {
  const [activeImage, setActiveImage] = useState(0);
  
  if (!project) return null;
  
  const isCompleted = project.status === 'Completed';
  
  // Combine hero image with gallery
  const images = [project.image, ...(project.gallery || [])].filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-auto max-h-[90vh] bg-white border border-gray-100">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Images Section */}
          <div className="relative bg-gray-100 flex flex-col justify-center">
            <div className="h-72 md:h-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none relative">
              <img 
                src={images[activeImage]} 
                alt={project.title} 
                className="w-full h-full object-cover"
              />
              
              {/* Image index indicator */}
              <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1.5 font-medium">
                <ImageIcon size={12} />
                {activeImage + 1} / {images.length}
              </div>
            </div>
            
            {/* Thumbnail navigation */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 bg-black/10 py-1.5 rounded-full max-w-fit mx-auto px-4 backdrop-blur-sm overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all flex-shrink-0",
                      activeImage === idx ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <DialogHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="text-xs font-semibold px-3 py-1 bg-Nestora-dark text-white border-none uppercase tracking-wide">
                      {project.category}
                    </Badge>
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
                
                <DialogTitle className="text-2xl font-bold mb-2 font-display text-Nestora-dark whitespace-normal leading-tight">
                  {project.title}
                </DialogTitle>
                <DialogDescription className="flex items-center text-sm text-gray-500 mb-6">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  {project.location}
                </DialogDescription>
              </DialogHeader>
              
              <div className="prose prose-sm max-w-none text-gray-600 mb-8 border-t border-gray-100 pt-6">
                <p className="whitespace-pre-line">{project.description}</p>
              </div>
            </div>
            
            {/* Action Desk */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mt-4">
              <h4 className="font-semibold text-sm text-Nestora-dark mb-3">Interested in a similar project?</h4>
              
              <div className="flex flex-col gap-2.5">
                <Link to={`/contact?service=${project.category}`} className="w-full" onClick={onClose}>
                  <Button size="sm" className="w-full bg-Nestora-blue hover:bg-Nestora-blue/90 text-white shadow-sm flex items-center justify-center gap-2 py-5">
                    <Hammer size={16} />
                    Discuss Your Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetails;
