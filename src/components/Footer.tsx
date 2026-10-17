import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  FileText, 
  ChevronRight,
  MessageCircle 
} from 'lucide-react';
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

  const companyName = settings?.companyName || 'Nestora';
  const phone = settings?.phone || '+91 95385 46100';
  const whatsappPhone = settings?.whatsapp?.trim() || '+91 99163 56569';
  const email = settings?.email || 'contact@nestora.com';
  const address = settings?.address || 'Hubli-Dharwad, Karnataka';
  
  const footerTagline = settings?.footerTagline || 
    `${companyName.toUpperCase()} is your trusted partner in Hubli-Dharwad for all property and related services. We are committed to provide reliable, transparent and professional services to help you achieve your dreams.`;

  return (
    <footer className="bg-brand-navy text-white">
      {/* Main 3-Column Section Matching Reference Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 pb-12">
          
          {/* Column 1: About Us */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center font-black shadow-xs shrink-0">
                <User className="h-5 w-5 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black font-display text-white tracking-tight">
                About Us
              </h3>
            </div>
            
            <p className="text-slate-200 text-sm leading-relaxed pt-1">
              {footerTagline}
            </p>

            {/* Social Media Row */}
            <div className="flex items-center space-x-3 pt-3">
              <SocialIcon href={settings?.socialLinks?.facebook} icon={<Facebook className="h-4 w-4" />} />
              <SocialIcon href={settings?.socialLinks?.twitter} icon={<Twitter className="h-4 w-4" />} />
              <SocialIcon href={settings?.socialLinks?.instagram} icon={<Instagram className="h-4 w-4" />} />
              <SocialIcon href={settings?.socialLinks?.linkedin} icon={<Linkedin className="h-4 w-4" />} />
            </div>
          </div>

          {/* Column 2: Contact Us */}
          <div className="space-y-4 md:border-x md:border-white/10 md:px-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center font-black shadow-xs shrink-0">
                <Phone className="h-5 w-5 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black font-display text-white tracking-tight">
                Contact Us
              </h3>
            </div>

            <div className="space-y-3.5 text-slate-100 text-sm pt-1">
              {phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-brand-yellow shrink-0 stroke-[2.5]" />
                  <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="hover:text-brand-yellow transition-colors font-semibold">
                    {phone}
                  </a>
                </div>
              )}

              {whatsappPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-brand-yellow shrink-0 stroke-[2.5]" />
                  <a 
                    href={`https://wa.me/${whatsappPhone.replace(/[^0-9+]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-brand-yellow transition-colors font-semibold"
                  >
                    {whatsappPhone}
                  </a>
                </div>
              )}

              {email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-brand-yellow shrink-0 stroke-[2.5]" />
                  <a href={`mailto:${email}`} className="hover:text-brand-yellow transition-colors font-semibold break-all">
                    {email}
                  </a>
                </div>
              )}

              {address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-brand-yellow shrink-0 stroke-[2.5]" />
                  <span className="font-semibold">{address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Terms And Condition */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center font-black shadow-xs shrink-0">
                <FileText className="h-5 w-5 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black font-display text-white tracking-tight">
                Terms And Condition
              </h3>
            </div>

            <p className="text-slate-200 text-sm leading-relaxed pt-1">
              Please read our terms and conditions carefully before using our services. By accessing this website, you agree to our terms and conditions.
            </p>

            <div className="pt-2">
              <Link to="/terms">
                <button className="bg-brand-yellow hover:bg-yellow-400 text-brand-navy font-black rounded-full px-6 py-2.5 text-sm inline-flex items-center gap-1.5 shadow-sm transition-transform hover:-translate-y-0.5">
                  Read More <ChevronRight className="h-4 w-4 stroke-[3]" />
                </button>
              </Link>
            </div>
          </div>

        </div>

        {/* Secondary Quick Navigation Strip (Preserving All Routes) */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link to="/" className="hover:text-brand-yellow transition-colors">Home</Link>
          <span>•</span>
          <Link to="/services" className="hover:text-brand-yellow transition-colors">Services</Link>
          <span>•</span>
          <Link to="/about" className="hover:text-brand-yellow transition-colors">About Us</Link>
          <span>•</span>
          <Link to="/projects" className="hover:text-brand-yellow transition-colors">Projects</Link>
          <span>•</span>
          <Link to="/real-estate" className="hover:text-brand-yellow transition-colors">Real Estate</Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-brand-yellow transition-colors">Contact Us</Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-brand-yellow transition-colors">Terms & Conditions</Link>
        </div>
      </div>

      {/* Bottom Copyright Bar Matching Reference */}
      <div className="bg-white text-brand-navy py-3.5 px-4 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-semibold gap-2">
          <p className="text-center sm:text-left text-brand-navy">
            © {new Date().getFullYear()} {companyName.toUpperCase()} | Hubli-Dharwad Properties. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-4 text-brand-navy/80">
            <Link to="/terms" className="hover:text-brand-blue hover:underline">
              Terms & Conditions
            </Link>
            <span>|</span>
            <Link to="/contact" className="hover:text-brand-blue hover:underline">
              Customer Support
            </Link>
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
      className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-brand-yellow hover:text-brand-navy transition-all shadow-xs"
    >
      {icon}
    </a>
  );
};

export default Footer;
