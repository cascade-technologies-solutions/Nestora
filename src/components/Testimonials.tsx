import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    id: 1,
    name: "Sahana",
    role: "First-time Home Buyer",
    content: "Nestora made finding my first home so easy. Their expert team guided me through every step of the process with patience and professionalism.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 2,
    name: "Vaibhav",
    role: "Property Investor",
    content: "I've worked with many real Nestora agencies, but Nestora stands out for their market knowledge and attention to detail. My investment portfolio has grown significantly thanks to their guidance.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 3,
    name: "Manu",
    role: "Luxury Home Seller",
    content: "The marketing strategy Nestora developed for my luxury property was exceptional. They found the perfect buyer in just three weeks, exceeding my asking price expectations.",
    image: "https://images.unsplash.com/photo-1664575602554-2087b04935a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

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

    // Auto-rotate testimonials every 5 seconds
    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      clearInterval(interval);
    };
  }, []);

  return (
    <section 
      id="testimonials" 
      className="py-20 md:py-30 bg-Nestora-blue/5 w-full"
      ref={sectionRef}
    >
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-Nestora-blue/10 text-Nestora-blue hover:bg-Nestora-blue/20 mb-4">
            Client Testimonials
          </Badge>
          <h2 className={cn(
            "text-4xl md:text-5xl font-bold mb-6 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            What Our Clients Say
          </h2>
          <p className={cn(
            "text-lg text-gray-600 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            Hear from our satisfied clients about their experience working with us to find their dream properties.
          </p>
        </div>

        <div className={cn(
          "relative max-w-5xl mx-auto transition-all duration-700 delay-200",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          {/* Testimonial Carousel */}
          <div className="glass-panel rounded-2xl p-6 md:p-16 relative overflow-hidden min-h-[400px] md:min-h-[350px]">
            <div className="absolute top-8 right-8 md:top-12 md:right-12 text-Nestora-blue/20">
              <Quote size={80} className="md:w-24 md:h-24" />
            </div>
            
            <div className="relative z-10 h-full">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id}
                  className={cn(
                    "transition-opacity duration-500 h-full",
                    activeIndex === index ? "opacity-100 relative" : "opacity-0 absolute inset-0"
                  )}
                >
                  <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                    <div className="w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-lg mx-auto md:mx-0">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-lg md:text-2xl italic text-gray-700 mb-6 md:mb-8">
                        "{testimonial.content}"
                      </p>
                      <div>
                        <h4 className="text-xl md:text-2xl font-bold">{testimonial.name}</h4>
                        <p className="text-md md:text-lg text-gray-500">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-3 mt-8 md:mt-12 absolute bottom-6 left-0 right-0">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-3 h-3 md:w-4 md:h-4 rounded-full transition-all",
                    activeIndex === index 
                      ? "bg-Nestora-blue scale-100" 
                      : "bg-gray-300 scale-75 hover:scale-90"
                  )}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to testimonial ₹{index + 1}`}
                />
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <button 
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors z-20"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            
            <button 
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors z-20"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
