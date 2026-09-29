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
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'About', path: '/about' },
    { label: 'Projects', path: '/projects' },
    { label: 'Real Estate', path: '/real-estate' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 md:px-8 bg-white border-b border-gray-100',
        isScrolled 
          ? 'py-2 shadow-sm' 
          : 'py-4'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-8 max-w-[180px] object-contain" />
          ) : (
            <span className="text-2xl font-display font-extrabold text-Nestora-dark">
              {companyName.toUpperCase()}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-5 py-2 font-bold text-sm transition-all duration-200 rounded-md",
                location.pathname === link.path 
                  ? "text-white bg-Nestora-blue"
                  : "text-Nestora-dark hover:text-Nestora-blue hover:bg-slate-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          {whatsappActive && (
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-Nestora-dark hover:bg-gray-800 text-white rounded-md px-5 font-bold h-10 flex items-center gap-2">
                <Phone size={16} className="text-Nestora-accent" />
                Enquiry
              </Button>
            </a>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 rounded-md h-10 border-gray-200 font-bold text-Nestora-dark"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User size={18} />
                <span>{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={16} className={cn('transition-transform', isUserMenuOpen ? 'rotate-180' : '')} />
              </Button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                  <Link 
                    to="/wishlist"
                    className="flex items-center px-4 py-2 text-sm text-Nestora-dark font-medium hover:bg-gray-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    My Wishlist
                  </Link>
                  <button 
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 font-medium hover:bg-gray-50"
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
                <Button variant="ghost" className="font-bold text-Nestora-dark hover:bg-slate-50 rounded-md">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          {whatsappActive && (
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:block hidden"
            >
              <Button size="sm" className="bg-Nestora-dark text-white rounded-md px-3 font-bold h-9 flex items-center gap-1.5">
                <Phone size={14} className="text-Nestora-accent" />
                Enquiry
              </Button>
            </a>
          )}

          <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-gray-200" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={20} className="text-Nestora-dark" /> : <Menu size={20} className="text-Nestora-dark" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[60px] bg-white z-40 lg:hidden flex flex-col p-6 animate-fade-in overflow-y-auto">
          <nav className="flex flex-col gap-2 mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={cn(
                  "py-3 px-4 rounded-md text-base font-bold transition-colors",
                  location.pathname === link.path 
                    ? "bg-Nestora-blue text-white" 
                    : "text-Nestora-dark hover:bg-slate-50"
                )}
              >
                {link.label}
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
                <Button className="bg-Nestora-dark text-white rounded-md w-full font-bold h-12 flex items-center justify-center gap-2">
                  <Phone size={18} className="text-Nestora-accent" />
                  Make an Enquiry
                </Button>
              </a>
            )}

            {isAuthenticated ? (
              <div className="flex flex-col gap-2 mt-4">
                <Link to="/wishlist" onClick={closeMenu}>
                  <Button variant="outline" className="w-full rounded-md font-bold h-12 flex items-center justify-center gap-2 border-gray-200">
                    <Heart size={18} />
                    My Wishlist
                  </Button>
                </Link>
                <Button variant="destructive" className="w-full rounded-md font-bold h-12" onClick={() => { handleLogout(); closeMenu(); }}>
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-4">
                <Link to="/login" onClick={closeMenu}>
                  <Button variant="outline" className="w-full rounded-md font-bold h-12 border-gray-200">
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