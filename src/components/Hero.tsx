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
      <section id="hero" className="relative min-h-[60vh] md:min-h-[45vh] lg:min-h-[50vh] flex items-center pt-24 pb-16 bg-Nestora-dark">
        <div className="absolute inset-0 bg-black/60" />
      </section>
    );
  }

  // Parse heading — support \n line breaks stored in CMS
  const headingLines = cms.heroHeading.split('\\n');

  return (
    <section id="hero" className="relative min-h-[60vh] md:min-h-[45vh] lg:min-h-[50vh] flex items-center pt-24 pb-16">
      {/* Background Images Carousel */}
      <div className="absolute inset-0 overflow-hidden">
        {cms.heroImages.map((img, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              activeIndex === index ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="absolute inset-0 bg-black/50" />
            <img
              src={img}
              alt="Engineering and Construction Infrastructure"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 lg:py-24">
        <div className={cn('max-w-4xl', isLoaded && 'animate-fade-in animation-delay-200')}>
          <div className="inline-flex items-center rounded-none bg-Nestora-accent px-4 py-1.5 mb-6">
            <span className="text-Nestora-dark text-xs md:text-sm font-bold tracking-widest uppercase">
              Construction • Renovation • Real Estate
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display text-white mb-6 leading-[1.1] tracking-tight drop-shadow-sm">
            {headingLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headingLines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="text-gray-100 text-lg md:text-xl lg:text-2xl mb-10 max-w-2xl font-medium leading-relaxed drop-shadow-sm">
            {cms.heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {cms.ctaButtons.map((btn, i) => {
              if (btn.variant === 'whatsapp') {
                return (
                  <a
                    key={i}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button className="bg-Nestora-dark hover:bg-gray-800 text-white rounded-none px-8 py-7 text-base font-bold shadow-lg w-full flex items-center justify-center gap-2">
                      <Phone size={18} className="text-Nestora-accent" />
                      {btn.label}
                    </Button>
                  </a>
                );
              }
              if (btn.variant === 'primary') {
                return (
                  <Link key={i} to={btn.href} className="w-full sm:w-auto">
                    <Button className="bg-Nestora-accent hover:bg-yellow-500 text-Nestora-dark font-extrabold rounded-none px-10 py-7 text-base shadow-lg w-full transition-transform hover:-translate-y-0.5">
                      {btn.label} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                );
              }
              return (
                <Link key={i} to={btn.href} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-none px-10 py-7 font-bold text-base w-full backdrop-blur-sm transition-transform hover:-translate-y-0.5"
                  >
                    {btn.label}
                  </Button>
                </Link>
              );
            })}

            {/* Fallback: show WhatsApp if settings has phone and no whatsapp button in CMS */}
            {whatsappActive &&
              !cms.ctaButtons.some((b) => b.variant === 'whatsapp') && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="bg-Nestora-dark hover:bg-gray-800 text-white rounded-none px-8 py-7 text-base font-bold shadow-lg w-full flex items-center justify-center gap-2">
                    <Phone size={18} className="text-Nestora-accent" />
                    WhatsApp Enquiry
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
