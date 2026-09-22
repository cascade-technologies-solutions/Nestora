import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { MapPin, Phone, Mail, Send, MessageSquare } from 'lucide-react';
import { CONFIG } from '@/config';
import { enquiryRepository } from '@/admin/repositories/enquiryRepository';
import { settingsRepository } from '@/admin/repositories/settingsRepository';
import type { SiteSettings } from '@/admin/types/admin';
import { cn } from '@/lib/utils';

const Contact = () => {
  const { toast } = useToast();
  const routerLocation = useLocation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Construction',
    location: '',
    message: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    settingsRepository.get().then(setSettings);
  }, []);

  // Pre-select service if passed in query string
  useEffect(() => {
    window.scrollTo(0, 0);
    const params = new URLSearchParams(routerLocation.search);
    const serviceParam = params.get('service');
    if (serviceParam) {
      if (serviceParam.includes('Construction')) setFormState(prev => ({ ...prev, service: 'Construction' }));
      else if (serviceParam.includes('Renovation') || serviceParam.includes('Repair')) setFormState(prev => ({ ...prev, service: 'Renovation & Repair' }));
      else if (serviceParam.includes('Waterproofing')) setFormState(prev => ({ ...prev, service: 'Waterproofing' }));
      else if (serviceParam.includes('Fabrication')) setFormState(prev => ({ ...prev, service: 'Fabrication' }));
      else if (serviceParam.includes('Earthmoving') || serviceParam.includes('Earth')) setFormState(prev => ({ ...prev, service: 'Earthmoving' }));
      else if (serviceParam.includes('Real Estate') || serviceParam.includes('property')) setFormState(prev => ({ ...prev, service: 'Real Estate' }));
      else if (serviceParam.includes('Corporation')) setFormState(prev => ({ ...prev, service: 'Corporation Official Works' }));
    }
  }, [routerLocation.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    
    if (name === 'name' || name === 'email' || name === 'phone' || name === 'location') {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', email: '', phone: '', location: '' };

    if (!formState.name.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    }
    if (!formState.email.trim()) {
      newErrors.email = 'Email address is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    if (!formState.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    }
    if (!formState.location.trim()) {
      newErrors.location = 'Project location is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      });
      return;
    }

    try {
      await enquiryRepository.create({
        name: formState.name.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        type: 'Service',
        message: `Service: ${formState.service}. Project Locality: ${formState.location}. Message: ${formState.message}`,
        status: 'New',
        priority: 'Medium'
      }, 'Public User');

      toast({
        title: "Enquiry Registered",
        description: "Thank you! Your technical request was successfully sent."
      });

      // Reset Form
      setFormState({
        name: '',
        email: '',
        phone: '',
        service: 'Construction',
        location: '',
        message: ''
      });
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "Failed to submit enquiry request.",
        variant: "destructive"
      });
    }
  };

  const phone = settings?.phone || CONFIG.CONTACT_PHONE;
  const email = settings?.email || CONFIG.CONTACT_EMAIL;
  const address = settings?.address || CONFIG.OFFICE_ADDRESS;
  const whatsappPhone = settings?.whatsapp?.trim() || CONFIG.WHATSAPP_PHONE;
  const whatsappActive = whatsappPhone.length > 0;
  const whatsappUrl = whatsappActive
    ? `https://wa.me/${whatsappPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(
        'Hello Nestora, I want to submit a project enquiry.'
      )}`
    : '#';

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16">
        <section className="relative py-20 bg-Nestora-dark text-white overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="Contact desk background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 md:px-12 text-center">
            <Badge className="bg-white/10 text-white hover:bg-white/20 mb-4 border-none">
              Get In Touch
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display">
              Contact &amp; Project Enquiry
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto font-light">
              Submit your project layout, repair enquiry, or waterproofing request. Our engineers are ready to consult.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              
              {/* Contact Information Column */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 shadow-subtle">
                  <h3 className="text-2xl font-bold mb-6 text-Nestora-dark font-display">Office &amp; Contact Desk</h3>
                  
                  <div className="space-y-6">
                    {/* Address Block */}
                    <div className="flex items-start">
                      <div className="bg-Nestora-blue/10 rounded-full p-3 mr-4 flex-shrink-0">
                        <MapPin className="h-6 w-6 text-Nestora-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base text-Nestora-dark">Office Address</h4>
                        {address ? (
                          <p className="text-gray-600 mt-1 text-sm whitespace-pre-line">{address}</p>
                        ) : (
                          <p className="text-gray-400 mt-1 text-sm italic">Address (Not Configured)</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Phone Block */}
                    <div className="flex items-start">
                      <div className="bg-Nestora-blue/10 rounded-full p-3 mr-4 flex-shrink-0">
                        <Phone className="h-6 w-6 text-Nestora-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base text-Nestora-dark">Phone Number</h4>
                        {phone ? (
                          <a 
                            href={`tel:${phone.replace(/\s+/g, '')}`}
                            className="text-Nestora-blue mt-1 text-sm block hover:underline"
                          >
                            {phone}
                          </a>
                        ) : (
                          <p className="text-gray-400 mt-1 text-sm italic">Phone (Not Configured)</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Email Block */}
                    <div className="flex items-start">
                      <div className="bg-Nestora-blue/10 rounded-full p-3 mr-4 flex-shrink-0">
                        <Mail className="h-6 w-6 text-Nestora-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base text-Nestora-dark">Email Address</h4>
                        {email ? (
                          <a 
                            href={`mailto:${email}`}
                            className="text-Nestora-blue mt-1 text-sm block hover:underline"
                          >
                            {email}
                          </a>
                        ) : (
                          <p className="text-gray-400 mt-1 text-sm italic">Email (Not Configured)</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {whatsappActive && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h4 className="font-semibold text-sm uppercase text-Nestora-blue mb-4 tracking-wide">Direct WhatsApp Enquiry</h4>
                      <a 
                        href={whatsappUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 py-6">
                          <MessageSquare className="h-5 w-5" />
                          Chat on WhatsApp
                        </Button>
                      </a>
                    </div>
                  )}
                </div>

                {/* Map Block (Placeholder) */}
                <div className="bg-gray-100 rounded-2xl h-64 flex flex-col items-center justify-center border border-gray-200 p-6 text-center">
                  <MapPin className="h-8 w-8 text-gray-400 mb-2" />
                  <h4 className="font-semibold text-sm text-gray-600">Site Location Map</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Map integration is disabled in placeholder state. Specify office coordinates to render.
                  </p>
                </div>
              </div>

              {/* Contact Form Column */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
                  <h3 className="text-2xl font-bold mb-2 text-Nestora-dark font-display">Submit Service Request</h3>
                  <p className="text-gray-500 text-sm mb-6">Complete the fields below. A division lead will review and schedule a site assessment.</p>

                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    
                    {/* Full Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className={cn("w-full h-11", errors.name && "border-red-500 focus-visible:ring-red-400")}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className={cn("w-full h-11", errors.email && "border-red-500 focus-visible:ring-red-400")}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formState.phone}
                        onChange={handleInputChange}
                        placeholder="+91 XXXXX XXXXX"
                        className={cn("w-full h-11", errors.phone && "border-red-500 focus-visible:ring-red-400")}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    {/* Service Dropdown */}
                    <div>
                      <label htmlFor="service" className="block text-sm font-semibold text-gray-700 mb-1">
                        Service Required <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formState.service}
                        onChange={handleInputChange}
                        className="w-full h-11 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-Nestora-blue px-3 text-sm"
                      >
                        <option value="Renovation & Repair">Renovation & Repair</option>
                        <option value="Construction">Construction</option>
                        <option value="Waterproofing">Waterproofing</option>
                        <option value="Fabrication">Fabrication</option>
                        <option value="Earthmoving">Earthmoving</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Corporation Official Works">Corporation Official Works</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Project Location */}
                    <div>
                      <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
                        Project Location <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="location"
                        name="location"
                        value={formState.location}
                        onChange={handleInputChange}
                        placeholder="City / Area of project (e.g. Vidyanagar, Hubli)"
                        className={cn("w-full h-11", errors.location && "border-red-500 focus-visible:ring-red-400")}
                      />
                      {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">
                        Project Details / Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formState.message}
                        onChange={handleInputChange}
                        placeholder="Provide details about dimensions, dampness issues, structural cracks, or specific layout queries..."
                        className="w-full min-h-[120px]"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-Nestora-blue hover:bg-Nestora-accent text-white w-full py-6 font-semibold"
                    >
                      Submit Project Enquiry <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
