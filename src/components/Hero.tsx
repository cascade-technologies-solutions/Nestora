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
      <section id="hero" className="relative min-h-screen flex items-center pt-20 bg-slate-900">
        <div className="absolute inset-0 bg-black/65" />
      </section>
    );
  }

  // Parse heading — support \n line breaks stored in CMS
  const headingLines = cms.heroHeading.split('\\n');

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20">
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
            <div className="absolute inset-0 bg-black bg-opacity-65" />
            <img
              src={img}
              alt="Engineering and Construction Infrastructure"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24">
        <div className={cn('max-w-3xl', isLoaded && 'animate-fade-in animation-delay-200')}>
          <div className="inline-flex items-center rounded-full bg-white bg-opacity-15 backdrop-blur-sm px-4 py-1.5 mb-6">
            <span className="text-white text-sm font-medium tracking-wide uppercase">
              Engineering &amp; Construction Solutions
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display text-white mb-6 leading-tight">
            {headingLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headingLines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-2xl font-light leading-relaxed">
            {cms.heroDescription}
          </p>

          <div className="flex flex-wrap gap-4 items-center">
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
                    <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-6 text-base w-full flex items-center justify-center gap-2">
                      <Phone size={18} />
                      {btn.label}
                    </Button>
                  </a>
                );
              }
              if (btn.variant === 'primary') {
                return (
                  <Link key={i} to={btn.href}>
                    <Button className="bg-Nestora-blue hover:bg-Nestora-accent text-white rounded-full px-8 py-6 text-base shadow-lg transition-transform hover:-translate-y-0.5">
                      {btn.label} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                );
              }
              return (
                <Link key={i} to={btn.href}>
                  <Button
                    variant="outline"
                    className="bg-white bg-opacity-10 backdrop-blur-sm hover:bg-white hover:text-Nestora-dark text-white border-white border-opacity-30 rounded-full px-8 py-6 text-base transition-transform hover:-translate-y-0.5"
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
                  <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-6 text-base w-full flex items-center justify-center gap-2">
                    <Phone size={18} />
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
