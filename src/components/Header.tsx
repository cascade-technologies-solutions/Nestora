import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, User, Heart, LogOut, Phone } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CONFIG } from '@/config';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { SiteSettings } from '@/admin/types/admin';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    settingsRepository.get().then(setSettings);
  }, []);

  const companyName = settings?.companyName || 'NestoraHub';
  const logoUrl = settings?.logoUrl || '';
  const whatsappPhone = settings?.whatsapp?.trim() || CONFIG.WHATSAPP_PHONE;
  const whatsappActive = whatsappPhone.length > 0;
  const whatsappUrl = whatsappActive
    ? `https://wa.me/${whatsappPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(
        'Hello Nestora, I would like to make an enquiry.'
      )}`
    : '#';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  const navLinks = [
    { label: 'Home', path: '/', isHome: true },
    { label: 'Services', path: '/services' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact Us', path: '/contact' },
    { label: 'Terms & Conditions', path: '/terms' },
  ];

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 md:px-8 bg-white border-b border-gray-100/80 shadow-xs',
        isScrolled 
          ? 'py-2.5 shadow-sm' 
          : 'py-4'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group" onClick={closeMenu}>
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-9 max-w-[190px] object-contain" />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5 12 3l9 7.5" className="text-brand-blue stroke-brand-blue" />
                  <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" className="text-emerald-500 stroke-emerald-500" />
                  <path d="M9 21V12h6v9" className="text-brand-navy stroke-brand-navy" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-display font-black tracking-tight text-brand-navy leading-none">
                  {companyName.toUpperCase()}
                </span>
                <span className="text-[10px] md:text-[11px] font-bold tracking-[0.18em] text-brand-navy/80 uppercase mt-0.5">
                  HUBLI-DHARWAD PROPERTIES
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 font-bold text-sm transition-all duration-200 rounded-full flex items-center gap-1.5",
                  isActive 
                    ? "text-white bg-brand-blue shadow-sm"
                    : "text-brand-navy hover:text-brand-blue hover:bg-brand-blue/5"
                )}
              >
                {link.isHome && (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -mt-0.5">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {whatsappActive && (
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-brand-yellow hover:bg-yellow-400 text-brand-navy rounded-full px-5 font-bold h-10 flex items-center gap-2 shadow-sm transition-transform hover:-translate-y-0.5">
                <Phone size={15} className="text-brand-navy stroke-[2.5]" />
                Enquiry
              </Button>
            </a>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 rounded-full h-10 border-gray-200 font-bold text-brand-navy hover:bg-gray-50"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User size={18} />
                <span>{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={16} className={cn('transition-transform', isUserMenuOpen ? 'rotate-180' : '')} />
              </Button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg py-1.5 z-50 border border-gray-100 animate-fade-in">
                  <Link 
                    to="/wishlist"
                    className="flex items-center px-4 py-2 text-sm text-brand-navy font-medium hover:bg-gray-50 rounded-lg mx-1"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Heart className="mr-2 h-4 w-4 text-red-500" />
                    My Wishlist
                  </Link>
                  <button 
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg mx-1"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="font-bold text-brand-navy hover:bg-brand-blue/5 rounded-full px-5">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2.5 lg:hidden">
          {whatsappActive && (
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:block hidden"
            >
              <Button size="sm" className="bg-brand-yellow text-brand-navy rounded-full px-3.5 font-bold h-9 flex items-center gap-1.5 shadow-xs">
                <Phone size={13} className="text-brand-navy stroke-[2.5]" />
                Enquiry
              </Button>
            </a>
          )}

          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-gray-200" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={20} className="text-brand-navy" /> : <Menu size={20} className="text-brand-navy" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[65px] bg-white z-40 lg:hidden flex flex-col p-6 animate-fade-in overflow-y-auto">
          <nav className="flex flex-col gap-2 mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={cn(
                  "py-3 px-4 rounded-xl text-base font-bold transition-colors flex items-center gap-2",
                  location.pathname === link.path 
                    ? "bg-brand-blue text-white shadow-xs" 
                    : "text-brand-navy hover:bg-brand-blue/5"
                )}
              >
                {link.isHome && (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                )}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 mt-auto pb-6">
            {whatsappActive && (
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
              >
                <Button className="bg-brand-yellow hover:bg-yellow-400 text-brand-navy rounded-full w-full font-bold h-12 flex items-center justify-center gap-2 shadow-sm">
                  <Phone size={18} className="text-brand-navy stroke-[2.5]" />
                  Make an Enquiry
                </Button>
              </a>
            )}

            {isAuthenticated ? (
              <div className="flex flex-col gap-2 mt-2">
                <Link to="/wishlist" onClick={closeMenu}>
                  <Button variant="outline" className="w-full rounded-full font-bold h-12 flex items-center justify-center gap-2 border-gray-200 text-brand-navy">
                    <Heart size={18} className="text-red-500" />
                    My Wishlist
                  </Button>
                </Link>
                <Button variant="destructive" className="w-full rounded-full font-bold h-12" onClick={() => { handleLogout(); closeMenu(); }}>
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link to="/login" onClick={closeMenu}>
                  <Button variant="outline" className="w-full rounded-full font-bold h-12 border-gray-200 text-brand-navy">
                    Sign In to Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;