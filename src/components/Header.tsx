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
      setIsScrolled(window.scrollY > 20);
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
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Projects', path: '/projects' },
    { label: 'Real Estate', path: '/real-estate' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 md:px-12 bg-white',
        isScrolled 
          ? 'py-3 shadow-md' 
          : 'py-5'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-2xl font-display font-bold text-Nestora-dark">
              {companyName.endsWith('Hub') ? (
                <>
                  {companyName.slice(0, -3)}<span className="text-Nestora-blue">Hub</span>
                </>
              ) : (
                companyName
              )}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-4 py-2 font-medium text-sm transition-colors duration-200 rounded-full",
                location.pathname === link.path 
                  ? "text-Nestora-blue bg-Nestora-blue/5"
                  : "text-Nestora-dark hover:text-Nestora-blue hover:bg-gray-50"
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
              <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-5 flex items-center gap-2">
                <Phone size={16} />
                WhatsApp Enquiry
              </Button>
            </a>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 rounded-full"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User size={18} />
                <span className="font-medium">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={16} className={cn('transition-transform', isUserMenuOpen ? 'rotate-180' : '')} />
              </Button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md py-1 z-50 border border-gray-100">
                  <Link 
                    to="/wishlist"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    My Wishlist
                  </Link>
                  <button 
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
                <Button variant="ghost" className="hover:bg-Nestora-blue/10 hover:text-Nestora-blue rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white rounded-full px-6">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          {whatsappActive && (
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:block hidden"
            >
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 flex items-center gap-1.5">
                <Phone size={14} />
                WhatsApp
              </Button>
            </a>
          )}

          <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[60px] bg-white z-40 lg:hidden flex flex-col p-6 border-t border-gray-100 animate-fade-in overflow-y-auto">
          <nav className="flex flex-col gap-4 mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={cn(
                  "py-3 text-lg font-medium border-b border-gray-50",
                  location.pathname === link.path 
                    ? "text-Nestora-blue" 
                    : "text-Nestora-dark hover:text-Nestora-blue"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-4 mt-auto pb-10">
            {whatsappActive && (
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
              >
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full w-full py-6 flex items-center justify-center gap-2">
                  <Phone size={18} />
                  WhatsApp Enquiry
                </Button>
              </a>
            )}

            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link to="/wishlist" onClick={closeMenu}>
                  <Button variant="outline" className="w-full rounded-full py-6 flex items-center justify-center gap-2">
                    <Heart size={18} />
                    My Wishlist
                  </Button>
                </Link>
                <Button variant="destructive" className="w-full rounded-full py-6" onClick={() => { handleLogout(); closeMenu(); }}>
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={closeMenu}>
                  <Button variant="outline" className="w-full rounded-full py-6">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={closeMenu}>
                  <Button className="bg-Nestora-blue hover:bg-Nestora-blue/90 text-white w-full rounded-full py-6">
                    Register
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