import { useState, useEffect } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import { homepageRepository } from '@/admin/repositories/homepageRepository';
import type { HomepageCMS, SiteSettings } from '@/admin/types/admin';

const Hero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cms, setCms] = useState<HomepageCMS | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Load CMS content on mount
  useEffect(() => {
    Promise.all([
      homepageRepository.get(),
      settingsRepository.get(),
    ]).then(([cmsData, settingsData]) => {
      setCms(cmsData);
      setSettings(settingsData);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!cms) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cms.heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [cms]);

  // Derive WhatsApp from settings
  const whatsappPhone = settings?.whatsapp?.trim() ?? '';
  const whatsappActive = whatsappPhone.length > 0;
  const whatsappUrl = whatsappActive
    ? `https://wa.me/${whatsappPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(
        'Hello Nestora, I would like to discuss a project with you.'
      )}`
    : '#';

  // Show skeleton while loading (keeps layout stable)
  if (!isLoaded || !cms) {
    return (
      <section id="hero" className="relative min-h-[70vh] flex items-center pt-24 pb-16 bg-brand-navy">
        <div className="absolute inset-0 bg-brand-navy/80" />
      </section>
    );
  }

  const heroImageList = [
    '/Nestora/hero-villa.jpg',
    ...cms.heroImages.filter(img => !img.includes('placeholder'))
  ];

  const companyName = settings?.companyName || 'Nestora';

  return (
    <section id="hero" className="relative min-h-[70vh] md:min-h-[75vh] lg:min-h-[80vh] flex items-center pt-28 pb-20 overflow-hidden">
      {/* Background Images Carousel */}
      <div className="absolute inset-0 overflow-hidden">
        {heroImageList.map((img, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              activeIndex % heroImageList.length === index ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={img}
              alt="Hubli-Dharwad Premium Properties"
              className="w-full h-full object-cover object-center scale-100"
            />
          </div>
        ))}

        {/* Dual Gradient Overlay Matching Reference */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/95 via-brand-navy/70 to-brand-navy/20 md:w-4/5 lg:w-3/5" />
        <div className="absolute inset-0 bg-brand-navy/25 mix-blend-multiply" />
      </div>

      {/* Hero Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className={cn('max-w-3xl', isLoaded && 'animate-fade-in animation-delay-200')}>
          {/* Reference Sub-headline / Kicker */}
          <p className="text-white text-lg sm:text-xl md:text-2xl font-medium tracking-wide mb-2 drop-shadow-sm">
            Find Your Dream Property
          </p>

          {/* Primary Wordmark */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display text-white leading-none tracking-tight drop-shadow-md mb-2">
            {companyName.toUpperCase()}
          </h1>

          {/* Golden Yellow Subline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-wider text-brand-yellow uppercase drop-shadow-sm mb-4">
            HUBLI-DHARWAD PROPERTIES
          </h2>

          {/* Pipe-separated Action Tagline */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white font-semibold text-sm sm:text-base md:text-lg mb-8 tracking-wide drop-shadow-sm">
            <span>Buy</span>
            <span className="text-brand-yellow font-bold">|</span>
            <span>Sell</span>
            <span className="text-brand-yellow font-bold">|</span>
            <span>Invest</span>
            <span className="text-brand-yellow font-bold">|</span>
            <span className="text-brand-yellow font-bold">Build Your Future</span>
          </div>

          <p className="text-slate-100/90 text-sm sm:text-base md:text-lg mb-8 max-w-xl font-normal leading-relaxed drop-shadow-xs">
            {cms.heroDescription || "Explore verified residential homes, commercial plots, and end-to-end property solutions across Hubli-Dharwad with our trusted team."}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link to="/real-estate" className="w-full sm:w-auto">
              <Button className="bg-brand-yellow hover:bg-yellow-400 text-brand-navy font-black rounded-full px-8 py-6 text-base shadow-lg transition-transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2">
                Explore Properties <ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </Button>
            </Link>

            {whatsappActive && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/60 rounded-full px-8 py-6 font-bold text-base w-full backdrop-blur-sm transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Phone size={18} className="text-brand-yellow" />
                  Make an Enquiry
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
