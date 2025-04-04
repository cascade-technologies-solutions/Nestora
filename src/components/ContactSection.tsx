
import { useState, useRef, useEffect } from 'react';
import { MapPin, Phone, Mail, Send, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ContactSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formState);
    // Reset form
    setFormState({ name: '', email: '', phone: '', message: '' });
    // Here you would normally send the data to your backend
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

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      id="contact" 
      className="py-16 bg-Nestora-light"
      ref={sectionRef}
    >
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-Nestora-blue/10 text-Nestora-blue hover:bg-Nestora-blue/20 mb-4">
            Contact Us
          </Badge>
          <h2 className={cn(
            "text-3xl md:text-4xl font-bold mb-4 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            Get in Touch With Our Experts
          </h2>
          <p className={cn(
            "text-gray-600 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            Have questions about our properties or services? Contact us today and our team of experts will be happy to assist you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <div className={cn(
            "transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          )}>
            <div className="glass-panel rounded-2xl p-8 h-full">
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-Nestora-blue/10 rounded-full p-3 mr-4">
                    <MapPin className="h-6 w-6 text-Nestora-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Office Address</h4>
                    <p className="text-gray-600">Nestora Ave, Sri Sai Properties,<br />Vidya Nagar, Hubli 580001</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-Nestora-blue/10 rounded-full p-3 mr-4">
                    <Phone className="h-6 w-6 text-Nestora-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Phone Number</h4>
                    <p className="text-gray-600">(+91) 99026 76457</p>
                    <p className="text-gray-600">(+91) 99074 58457</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-Nestora-blue/10 rounded-full p-3 mr-4">
                    <Mail className="h-6 w-6 text-Nestora-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Email Address</h4>
                    <p className="text-gray-600">info@Nestora.com</p>
                    <p className="text-gray-600">support@Nestora.com</p>
                  </div>
                </div>
              </div>
              
              <hr className="my-8 border-gray-200" />
              
              <div>
                <h4 className="font-semibold text-lg mb-4">Office Hours</h4>
                <div className="space-y-2 text-gray-600">
                  <p className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className={cn(
            "transition-all duration-700 delay-300",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
          )}>
            <div className="bg-white rounded-2xl p-8 shadow-subtle">
              <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleInputChange}
                      placeholder="Name"
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formState.phone}
                      onChange={handleInputChange}
                      placeholder="(91+)"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your requirements..."
                      className="w-full min-h-[120px]"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="bg-Nestora-blue hover:bg-Nestora-accent text-white w-full py-6">
                  Send Message <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By submitting this form, you agree to our <a href="#" className="text-Nestora-blue underline">Terms of Service</a> and <a href="#" className="text-Nestora-blue underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default ContactSection;
