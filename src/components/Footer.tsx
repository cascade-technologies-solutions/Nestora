import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
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
  const footerTagline = settings?.footerTagline || 'From renovation and waterproofing to construction, fabrication, earthmoving, and real estate – complete engineering and project solutions under one roof.';

  const hasContactInfo = address || phone || email;

  return (
    <footer className="bg-Nestora-dark text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Company Information */}
          <div>
            <h3 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-8 w-auto object-contain" />
              ) : (
                <>
                  {companyName.endsWith('Hub') ? (
                    <>
                      {companyName.slice(0, -3)}<span className="text-Nestora-blue">Hub</span>
                    </>
                  ) : (
                    companyName
                  )}
                </>
              )}
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              {footerTagline}
            </p>
            <div className="flex space-x-4">
              <SocialIcon href={settings?.socialLinks?.facebook} icon={<Facebook className="h-5 w-5" />} />
              <SocialIcon href={settings?.socialLinks?.twitter} icon={<Twitter className="h-5 w-5" />} />
              <SocialIcon href={settings?.socialLinks?.instagram} icon={<Instagram className="h-5 w-5" />} />
              <SocialIcon href={settings?.socialLinks?.linkedin} icon={<Linkedin className="h-5 w-5" />} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/services">Services</FooterLink>
              <FooterLink to="/projects">Projects</FooterLink>
              <FooterLink to="/real-estate">Real Estate</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Our Divisions</h4>
            <ul className="space-y-3">
              <FooterLink to="/services">Construction Works</FooterLink>
              <FooterLink to="/services">Renovation & Repair</FooterLink>
              <FooterLink to="/services">Waterproofing Solutions</FooterLink>
              <FooterLink to="/services">Fabrication Works</FooterLink>
              <FooterLink to="/services">Earthmoving & Site Development</FooterLink>
              <FooterLink to="/services">Real Estate Services</FooterLink>
              <FooterLink to="/services">Corporation Official Works</FooterLink>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Working Hours</h4>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              Our engineering, project planning, and support services operate on the following schedule:
            </p>
            <div className="space-y-2 text-gray-400 text-sm">
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

        {/* Contact Info Bar (Rendered only if configuration variables are set) */}
        {hasContactInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-gray-800">
            {address ? (
              <ContactItem icon={<MapPin className="h-5 w-5" />} text={address} />
            ) : (
              <div className="hidden md:block"></div>
            )}
            {phone ? (
              <ContactItem icon={<Phone className="h-5 w-5" />} text={phone} />
            ) : (
              <div className="hidden md:block"></div>
            )}
            {email ? (
              <ContactItem icon={<Mail className="h-5 w-5" />} text={email} />
            ) : (
              <div className="hidden md:block"></div>
            )}
          </div>
        )}

        {/* Copyright */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="#" className="text-gray-500 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm">Terms of Service</a>
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
      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-Nestora-blue transition-colors"
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
        className="text-gray-400 hover:text-white transition-colors flex items-center"
      >
        <span className="mr-2 text-xs">›</span> {children}
      </Link>
    </li>
  );
};

const ContactItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => {
  return (
    <div className="flex items-center text-gray-400">
      <div className="mr-3 text-Nestora-blue flex-shrink-0">{icon}</div>
      <span className="text-sm">{text}</span>
    </div>
  );
};

export default Footer;
