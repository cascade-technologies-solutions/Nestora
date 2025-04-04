
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-Nestora-dark text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Company Information */}
          <div>
            <h3 className="text-2xl font-bold font-display mb-6">
              Nestora<span className="text-Nestora-blue">Hub</span>
            </h3>
            <p className="text-gray-400 mb-6">
              Your trusted partner in finding the perfect property. We strive to provide exceptional service and expertise in all aspects of real Nestora.
            </p>
            <div className="flex space-x-4">
              <SocialIcon icon={<Facebook className="h-5 w-5" />} />
              <SocialIcon icon={<Twitter className="h-5 w-5" />} />
              <SocialIcon icon={<Instagram className="h-5 w-5" />} />
              <SocialIcon icon={<Linkedin className="h-5 w-5" />} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <FooterLink href="#hero">Home</FooterLink>
              <FooterLink href="#about">About Us</FooterLink>
              <FooterLink href="#services">Services</FooterLink>
              <FooterLink href="#properties">Properties</FooterLink>
              <FooterLink href="#blog">Blog</FooterLink>
              <FooterLink href="#contact">Contact Us</FooterLink>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Our Services</h4>
            <ul className="space-y-3">
              <FooterLink href="#services">Buying Property</FooterLink>
              <FooterLink href="#services">Selling Property</FooterLink>
              <FooterLink href="#services">Property Management</FooterLink>
              <FooterLink href="#services">Investment Consulting</FooterLink>
              <FooterLink href="#services">Market Analysis</FooterLink>
              <FooterLink href="#services">Vastu Consulting</FooterLink>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Stay Updated</h4>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest property listings and real Nestora news.
            </p>
            <div className="flex space-x-0">
              <Input 
                placeholder="Your email address" 
                className="rounded-l-full rounded-r-none border-r-0 bg-gray-800 border-gray-700 text-white focus:ring-Nestora-blue focus:border-Nestora-blue"
              />
              <Button className="bg-Nestora-blue hover:bg-Nestora-accent text-white rounded-l-none rounded-r-full">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-gray-800">
          <ContactItem icon={<MapPin className="h-5 w-5" />} text="Nestora Ave, Sri Sai Properties,
Vidya Nagar, Hubli 580001" />
          <ContactItem icon={<Phone className="h-5 w-5" />} text="(+91) 99026 76457" />
          <ContactItem icon={<Mail className="h-5 w-5" />} text="info@Nestora.com" />
        </div>

        {/* Copyright */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Nestora. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="#" className="text-gray-500 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => {
  return (
    <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-Nestora-blue transition-colors">
      {icon}
    </a>
  );
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <li>
      <a 
        href={href} 
        className="text-gray-400 hover:text-white transition-colors flex items-center"
      >
        <span className="mr-2 text-xs">›</span> {children}
      </a>
    </li>
  );
};

const ContactItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => {
  return (
    <div className="flex items-center text-gray-400">
      <div className="mr-3 text-Nestora-blue">{icon}</div>
      <span>{text}</span>
    </div>
  );
};

export default Footer;
