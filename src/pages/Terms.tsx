import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, FileText, Scale, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-brand-navy">
      <Header />

      <main className="flex-grow pt-28 pb-20">
        {/* Hero Banner */}
        <section className="bg-brand-navy text-white py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-brand-blue/30" />
          <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
            <div className="flex items-center gap-2 text-brand-yellow font-bold text-xs uppercase tracking-wider mb-4">
              <Link to="/" className="hover:underline">Home</Link>
              <span>/</span>
              <span className="text-white/80">Terms & Conditions</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-4">
              Terms & Conditions
            </h1>
            <p className="text-slate-200 text-base md:text-lg max-w-2xl leading-relaxed">
              Please read these terms and conditions carefully before using our website and services. By accessing or using Nestora, you agree to be bound by these provisions.
            </p>
          </div>
        </section>

        {/* Content Container */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 -mt-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-12 space-y-10">
            
            {/* Effective Date Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <FileText className="w-4 h-4 text-brand-blue" />
                <span>Last Updated: January 2025</span>
              </div>
              <Badge className="bg-brand-blue/10 text-brand-navy font-bold rounded-full px-4 py-1">
                Hubli-Dharwad Jurisdiction
              </Badge>
            </div>

            {/* Section 1: Overview */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-display text-brand-navy flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-sm font-black">1</span>
                Introduction & Acceptance of Terms
              </h2>
              <p className="text-slate-600 leading-relaxed text-base">
                Welcome to Nestora (Hubli-Dharwad Properties). These Terms and Conditions govern your access to and use of our corporate website, property listings, enquiry mechanisms, and multi-service offerings including Real Estate advisory, Construction, Fabrication, Renovation, Repair Works, Packers & Movers, Security Services, Documentation, and Property Advertising.
              </p>
              <p className="text-slate-600 leading-relaxed text-base">
                By browsing our site, registering an account, making enquiries, or contracting our engineering and property teams, you accept and agree to comply with these terms in full. If you do not agree, you must discontinue use of our site.
              </p>
            </div>

            {/* Section 2: Real Estate Listings & Advisory */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-display text-brand-navy flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-sm font-black">2</span>
                Real Estate Listings & Information Accuracy
              </h2>
              <p className="text-slate-600 leading-relaxed text-base">
                Property details, pricing estimates, square footage measurements, photographs, locality landmarks, and availability statuses provided on this platform are compiled from on-ground inspections, developer documents, and property owners.
              </p>
              <ul className="space-y-2.5 text-slate-600 text-base list-disc list-inside">
                <li>All listings are subject to prior sale, lease, price revision, or withdrawal without prior notice.</li>
                <li>Prospective buyers and tenants are advised to independently verify title deeds, encumbrance certificates (EC), municipal approvals, and Khata extracts prior to financial commitments.</li>
                <li>Nestora provides facilitation and title scrutiny support, but ultimate transaction agreements are entered directly between the contracting parties.</li>
              </ul>
            </div>

            {/* Section 3: Engineering & Contracting Services */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-display text-brand-navy flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-sm font-black">3</span>
                Construction, Renovation & Service Contracts
              </h2>
              <p className="text-slate-600 leading-relaxed text-base">
                For civil construction, fabrication, repairs, waterproofing, or renovation projects:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-pastel-blue border border-brand-blue/20">
                  <h3 className="font-bold text-brand-navy mb-1.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                    Detailed Scope Quotations
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Formal cost estimates specify material grades, execution milestones, payment terms, and delivery schedules.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-pastel-yellow border border-amber-300">
                  <h3 className="font-bold text-brand-navy mb-1.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Site Access & Approvals
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clients are responsible for providing unobstructed site access, water/power connections, and municipal permissions unless turnkey documentation is contracted.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: User Accounts & Data Security */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-display text-brand-navy flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-sm font-black">4</span>
                Account Security & Wishlists
              </h2>
              <p className="text-slate-600 leading-relaxed text-base">
                Registered users are responsible for safeguarding login credentials. Nestora employs bcrypt password encryption, JWT authentication, and session tokens to secure your profile and saved wishlist properties. Any unauthorized activity should be reported immediately to our support team.
              </p>
            </div>

            {/* Section 5: Intellectual Property */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-display text-brand-navy flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-sm font-black">5</span>
                Intellectual Property Rights
              </h2>
              <p className="text-slate-600 leading-relaxed text-base">
                All branding, wordmarks, graphics, photographic assets, page designs, and software code on Nestora are the proprietary property of Nestora and its licensors. Unauthorized copying, scraping, reproduction, or distribution is strictly prohibited.
              </p>
            </div>

            {/* Section 6: Limitation of Liability */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-display text-brand-navy flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-sm font-black">6</span>
                Limitation of Liability & Dispute Resolution
              </h2>
              <p className="text-slate-600 leading-relaxed text-base">
                To the maximum extent permitted by applicable laws of Karnataka, India, Nestora shall not be liable for indirect, incidental, or consequential damages resulting from site downtime or third-party listings. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Hubli-Dharwad, Karnataka.
              </p>
            </div>

            {/* Section 7: Contact Us */}
            <div className="p-6 md:p-8 rounded-2xl bg-brand-navy text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl font-bold font-display text-white">Have Questions About Our Terms?</h3>
                <p className="text-slate-300 text-sm max-w-lg">
                  Reach out to our administrative office in Hubli-Dharwad for clarifications on contract procedures or municipal compliance.
                </p>
              </div>
              <Link to="/contact">
                <button className="bg-brand-yellow hover:bg-yellow-400 text-brand-navy font-black rounded-full px-7 py-3 text-sm shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap">
                  Contact Support
                </button>
              </Link>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
