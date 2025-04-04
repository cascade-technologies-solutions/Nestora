import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const heroImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
];

const Hero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    setIsLoaded(true);

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20">
      {/* Background Images Carousel */}
      <div className="absolute inset-0 overflow-hidden">
        {heroImages.map((img, index) => (
          <div 
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              activeIndex === index ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40" />
            <img 
              src={img} 
              alt="Luxury property" 
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 py-6 md:py-12">
        <div className="max-w-3xl animate-fade-in animation-delay-200">
          <div className="inline-flex items-center rounded-full bg-white bg-opacity-20 backdrop-blur-sm px-4 py-1.5 mb-6">
            <span className="text-white text-sm font-medium">Discover Your Dream Property</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Find Your <span className="text-Nestora-blue">Perfect Place</span> to Call Home
          </h1>
          
          <p className="text-white text-lg md:text-xl mb-8 max-w-2xl">
            Explore premium properties in top locations with our expert real Nestora services tailored to your needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button 
              className="bg-Nestora-blue hover:bg-Nestora-accent text-white rounded-full px-8 py-6 text-base"
              onClick={() => scrollToSection('properties')}
            >
              Explore Properties <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              className="bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 text-white border-white border-opacity-20 rounded-full px-8 py-6 text-base"
              onClick={() => scrollToSection('services')}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
