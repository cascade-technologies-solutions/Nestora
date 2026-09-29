import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONFIG } from '@/config';
import { useState, useEffect } from 'react';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { SiteSettings } from '@/admin/types/admin';

const Footer = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    settingsRepository.get().then(setSettings);
  }, []);

  const companyName = settings?.companyName || 'NestoraHub';
  const logoUrl = settings?.logoUrl || '';
  const phone = settings?.phone || CONFIG.CONTACT_PHONE;
  const email = settings?.email || CONFIG.CONTACT_EMAIL;
  const address = settings?.address || CONFIG.OFFICE_ADDRESS;
  const whatsappPhone = settings?.whatsapp?.trim() || CONFIG.WHATSAPP_PHONE;
  
  const footerTagline = settings?.footerTagline || 'Complete engineering and project solutions under one roof. We build, restore, and develop infrastructure with a focus on quality and transparency.';

  return (
    <footer className="bg-Nestora-dark text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 mb-16">
          
          {/* Column 1: About Nestora */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-display flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-white tracking-wide">
                  {companyName.toUpperCase()}
                </span>
              )}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              {footerTagline}
            </p>
            <div className="flex space-x-4 pt-2">
              <SocialIcon href={settings?.socialLinks?.facebook} icon={<Facebook className="h-4 w-4" />} />
              <SocialIcon href={settings?.socialLinks?.twitter} icon={<Twitter className="h-4 w-4" />} />
              <SocialIcon href={settings?.socialLinks?.instagram} icon={<Instagram className="h-4 w-4" />} />
              <SocialIcon href={settings?.socialLinks?.linkedin} icon={<Linkedin className="h-4 w-4" />} />
            </div>
          </div>

          {/* Column 2: Navigation / Services */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-lg font-bold uppercase tracking-wider text-white">Quick Links</h4>
              <ul className="space-y-3">
                <FooterLink to="/about">About Us</FooterLink>
                <FooterLink to="/projects">Our Projects</FooterLink>
                <FooterLink to="/real-estate">Real Estate</FooterLink>
                <FooterLink to="/contact">Contact</FooterLink>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-lg font-bold uppercase tracking-wider text-white">Services</h4>
              <ul className="space-y-3">
                <FooterLink to="/services">Construction</FooterLink>
                <FooterLink to="/services">Renovation</FooterLink>
                <FooterLink to="/services">Waterproofing</FooterLink>
                <FooterLink to="/services">Fabrication</FooterLink>
              </ul>
            </div>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold uppercase tracking-wider text-white">Contact Info</h4>
            <div className="space-y-4">
              {phone && (
                <ContactItem icon={<Phone className="h-5 w-5" />} text={phone} label="Phone" />
              )}
              {whatsappPhone && (
                <ContactItem icon={<MessageCircle className="h-5 w-5" />} text={whatsappPhone} label="WhatsApp" />
              )}
              {email && (
                <ContactItem icon={<Mail className="h-5 w-5" />} text={email} label="Email" />
              )}
              {address && (
                <ContactItem icon={<MapPin className="h-5 w-5" />} text={address} label="Location" />
              )}
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-gray-400">
            <span className="text-gray-400">Privacy Policy</span>
            <span className="text-gray-400">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon, href }: { icon: React.ReactNode; href?: string }) => {
  return (
    <a 
      href={href || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="w-9 h-9 rounded-full bg-gray-800 text-Nestora-accent flex items-center justify-center hover:bg-Nestora-accent hover:text-Nestora-dark transition-colors"
    >
      {icon}
    </a>
  );
};

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  return (
    <li>
      <Link 
        to={to} 
        className="text-gray-300 hover:text-Nestora-accent transition-colors flex items-center text-sm"
      >
        {children}
      </Link>
    </li>
  );
};

const ContactItem = ({ icon, text, label }: { icon: React.ReactNode; text: string; label: string }) => {
  return (
    <div className="flex items-start">
      <div className="mt-0.5 mr-4 text-Nestora-accent flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm text-white font-medium break-all">{text}</p>
      </div>
    </div>
  );
};

export default Footer;
