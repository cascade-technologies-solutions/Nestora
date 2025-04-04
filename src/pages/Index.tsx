import { useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import FeaturedProperties from '@/components/FeaturedProperties';
import Services from '@/components/Services';
import Localities from '@/components/Localities';
import Testimonials from '@/components/Testimonials';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import { useLocation } from 'react-router-dom';

const Index = () => {
  const location = useLocation();

  // Initialize intersection observer for animations
  useEffect(() => {
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      elements.forEach(element => {
        observer.observe(element);
      });
    };
    
    animateOnScroll();
    
    // Scroll to the correct section if hash is present in URL
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          setTimeout(() => {
            window.scrollTo({
              top: element.offsetTop - 80, // Offset for header
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Check if we're coming back from search with query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (params.has('location') || params.has('type') || params.has('price')) {
      // Scroll to properties section if coming back with search params
      const propertiesSection = document.getElementById('properties');
      if (propertiesSection) {
        setTimeout(() => {
          propertiesSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.search]);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Header />
      <main>
        <Hero />
        <div id="properties">
          <FeaturedProperties />
        </div>
        <Services />
        <Localities />
        <div id="testimonials">
          <Testimonials />
        </div>
        <div id="contact">
          <ContactSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
