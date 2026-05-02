"use client";
import React, { useEffect, useRef, useState } from 'react';

function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

export default function Main() {
  return <LandingPage />;
}

function LandingPage() {
  const [heroRef, heroVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [howItWorksRef, howItWorksVisible] = useScrollReveal();
  const [featureRef, featureVisible] = useScrollReveal();
  const [testimonialsRef, testimonialsVisible] = useScrollReveal();
  const [pricingRef, pricingVisible] = useScrollReveal();
  const [faqRef, faqVisible] = useScrollReveal();

  return (
    <div className="md:block min-h-screen relative bg-[#0d141d] text-[#dce3f0] overflow-x-hidden selection:bg-[#4b8eff] selection:text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 landing-bg-grid pointer-events-none opacity-40" />
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#4b8eff]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating WhatsApp Support */}
      <a
        href="https://wa.me/971557369629"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[100] group flex items-center gap-4"
      >
        <div className="bg-[#0d141d]/95 backdrop-blur-md border border-[#4edea3]/20 px-4 py-2 rounded-xl opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block">
          <p className="text-[10px] font-black text-[#4edea3] uppercase tracking-widest">Chat with an Expert</p>
        </div>
        <div className="size-14 bg-[#4edea3] rounded-2xl flex items-center justify-center text-[#0d141d] shadow-[0_0_20px_rgba(78,222,163,0.3)] hover:scale-110 hover:rotate-6 transition-all active:scale-95">
           <svg viewBox="0 0 24 24" className="size-7 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </div>
      </a>

      <nav className="fixed top-0 z-[100] w-full h-20 flex items-center justify-between px-6 md:px-12 bg-[#0d141d]/80 backdrop-blur-md border-b border-[#414755]/20">
        <div className="text-2xl font-black tracking-tighter text-[#4b8eff] hover:scale-105 transition-transform cursor-pointer">REZZY</div>
        <div className="hidden md:flex items-center gap-8">
          {['features', 'pricing', 'faq'].map((link) => (
            <a key={link} href={`#${link}`} className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] hover:text-white transition-all hover:-translate-y-0.5">
              {link}
            </a>
          ))}
          <a href="/login" className="h-10 px-6 rounded-xl bg-[#4b8eff] text-white font-black text-xs uppercase tracking-widest hover:bg-[#4b8eff]/90 hover:shadow-[0_0_20px_rgba(75,142,255,0.3)] transition-all flex items-center">
            Dashboard
          </a>
        </div>
      </nav>

      <main className="relative z-10 pt-32">

        {/* HERO */}
        <section
          ref={heroRef}
          className={`max-w-7xl mx-auto px-6 text-center mb-32 opacity-0 ${heroVisible ? 'animate-reveal' : ''}`}
        >
          <div className="inline-block px-4 py-1.5 mb-8 rounded-full border border-[#4b8eff]/30 bg-[#4b8eff]/5 hover:bg-[#4b8eff]/10 transition-colors">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4edea3]">Now Trusted by 850+ UAE Businesses</p>
          </div>
          <h1 className="text-6xl md:text-[120px] font-black tracking-tighter text-white leading-[0.85] mb-12">
            BOOKING THE <br />
            <span className="text-transparent hover:text-white transition-all duration-700 cursor-default" style={{ WebkitTextStroke: "1.5px #4b8eff" }}>EMIRATES.</span>
          </h1>
          <p className="text-lg md:text-xl font-semibold text-[#8b90a0] max-w-xl mx-auto leading-relaxed mb-12">
            Stop juggling calls and WhatsApp messages. <br />
            Automate your appointments. Grow your revenue.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a
              href="/register"
              className="inline-flex items-center justify-center h-16 px-12 rounded-2xl bg-[#4b8eff] text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#4b8eff]/20"
            >
              Start Free — No Card Required
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center h-16 px-12 rounded-2xl border border-[#414755] text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all"
            >
              See How It Works
            </a>
          </div>
        </section>

        {/* STATS STRIP */}
        <section
          ref={statsRef}
          className={`border-y border-[#414755]/10 bg-[#0d141d] mb-32 opacity-0 ${statsVisible ? 'animate-reveal' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Shops Onboarded", value: "850+" },
                { label: "Avg Setup Time", value: "<30 min" },
                { label: "No-Show Reduction", value: "38%" },
                { label: "Customer Satisfaction", value: "99%" }
              ].map((stat, i) => (
                <div key={i} className="text-center md:text-left hover:translate-x-1 transition-transform">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4b8eff] mb-2">{stat.label}</p>
                  <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          ref={howItWorksRef}
          className={`max-w-7xl mx-auto px-6 mb-32 opacity-0 ${howItWorksVisible ? 'animate-reveal' : ''}`}
        >
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4b8eff] mb-4">Get Started</p>
            <h2 className="text-5xl font-black text-white tracking-tighter italic leading-tight">Up and running in 3 steps.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', icon: 'app_registration', title: 'Sign up free', desc: 'Register your shop in 60 seconds. No credit card.' },
              { num: '02', icon: 'link', title: 'Connect WhatsApp', desc: 'Link your business number, import your services.' },
              { num: '03', icon: 'event_available', title: 'Take bookings', desc: 'Customers book online. You get notified instantly.' },
            ].map((step, i) => (
              <div
                key={i}
                className="relative p-8 rounded-2xl bg-[#151c25]/30 border border-[#414755]/20 hover:border-[#4b8eff]/30 transition-all overflow-hidden group"
              >
                <p className="absolute -right-2 -bottom-6 text-[120px] font-black text-[#4b8eff]/[0.07] tracking-tighter leading-none pointer-events-none select-none group-hover:text-[#4b8eff]/10 transition-colors">
                  {step.num}
                </p>
                <div className="size-12 rounded-xl bg-[#4b8eff]/10 border border-[#4b8eff]/20 flex items-center justify-center mb-6 relative z-10">
                  <span className="material-symbols-outlined text-[#4b8eff] text-[24px]">{step.icon}</span>
                </div>
                <h3 className="text-white font-black uppercase text-sm mb-3 tracking-widest relative z-10">{step.title}</h3>
                <p className="text-[#8b90a0] text-sm font-medium relative z-10">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE SECTION */}
        <section
          id="features"
          ref={featureRef}
          className={`max-w-7xl mx-auto px-6 mb-32 opacity-0 ${featureVisible ? 'animate-reveal' : ''}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-[#151c25]/30 p-2 rounded-[40px] border border-[#414755]/20 shadow-2xl hover:border-[#4b8eff]/30 transition-colors group">
               <div className="bg-[#080f17] rounded-[36px] p-8 overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-white uppercase text-xs">Live Schedule Preview</h4>
                    <div className="flex gap-2">
                      <div className="size-2 rounded-full bg-[#4edea3] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { time: '10:00 AM', name: 'Khalid Al-Mansoori', service: 'Full Grooming', status: 'Confirmed' },
                      { time: '11:30 AM', name: 'Sarah Jenkins', service: 'Ceramic Coating', status: 'In Progress' },
                      { time: '02:00 PM', name: 'Ahmed Raza', service: 'Oil Change', status: 'Pending' },
                    ].map((row, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-[#0d141d] border border-[#414755]/10 flex justify-between items-center group-hover:border-[#4b8eff]/20 transition-all">
                        <div>
                          <p className="text-[10px] text-[#4b8eff] font-black">{row.time}</p>
                          <p className="text-sm font-bold text-white">{row.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-[#4edea3] font-black uppercase tracking-tighter">{row.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
            <div className="space-y-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4b8eff]">Business OS</p>
              <h2 className="text-5xl font-black text-white tracking-tighter italic leading-tight">Run your shop <br /> on autopilot.</h2>
              <div className="space-y-6">
                {[
                  { title: 'WhatsApp Automation', desc: 'Sync with your official business number.' },
                  { title: 'Staff Performance', desc: 'Real-time revenue tracking per technician.' },
                  { title: 'Smart Reminders', desc: 'Automated WhatsApp nudges that cut no-shows.' }
                ].map((f, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#151c25]/30 border border-[#414755]/10 hover:bg-[#4b8eff]/5 hover:border-[#4b8eff]/20 transition-all cursor-default">
                    <h4 className="text-white font-black uppercase text-xs mb-2 tracking-widest">{f.title}</h4>
                    <p className="text-[#8b90a0] text-sm font-medium">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS — Placeholder testimonials, swap with real customer quotes when available */}
        <section
          ref={testimonialsRef}
          className={`max-w-7xl mx-auto px-6 mb-32 opacity-0 ${testimonialsVisible ? 'animate-reveal' : ''}`}
        >
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4b8eff] mb-4">What Owners Say</p>
            <h2 className="text-5xl font-black text-white tracking-tighter italic leading-tight">Trusted by shop owners <br /> across the UAE.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                initials: 'KA',
                name: 'Khalid Al-Mansoori',
                shop: 'Al-Falah Auto Detailing',
                city: 'Sharjah',
                quote: 'Cut my no-shows by half in the first month. The WhatsApp automation just works — my staff stopped chasing customers.'
              },
              {
                initials: 'FH',
                name: 'Fatima Hassan',
                shop: 'Glow Beauty Lounge',
                city: 'Dubai',
                quote: 'We used to manage bookings on three different WhatsApp groups. Now everything is in one place and customers love the reminders.'
              },
              {
                initials: 'AR',
                name: 'Ahmed Raza',
                shop: 'Crown Barbers',
                city: 'Abu Dhabi',
                quote: 'Setup took me 20 minutes. The Arabic interface meant my whole team could use it from day one.'
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-[#151c25]/30 border border-[#414755]/20 hover:border-[#4b8eff]/30 hover:bg-[#151c25]/50 transition-all flex flex-col"
              >
                <div className="flex gap-1 mb-6">
                  {[0,1,2,3,4].map((s) => (
                    <span key={s} className="material-symbols-outlined text-[#4edea3] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-[#dce3f0] text-sm font-medium leading-relaxed mb-8 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-4 pt-6 border-t border-[#414755]/20">
                  <div className="size-12 rounded-full bg-[#4b8eff]/10 border border-[#4b8eff]/20 flex items-center justify-center">
                    <span className="text-[#4b8eff] font-black text-sm tracking-tighter">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{t.name}</p>
                    <p className="text-[#8b90a0] text-[11px] font-semibold">{t.shop} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section
          id="pricing"
          ref={pricingRef}
          className={`max-w-7xl mx-auto px-6 mb-32 opacity-0 ${pricingVisible ? 'animate-reveal' : ''}`}
        >
          <div className="text-center mb-16">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4b8eff] mb-4">Pricing</p>
             <h2 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase italic">License Tiers.</h2>
             <p className="text-[#8b90a0] text-sm font-semibold">Start free. Upgrade when you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: '0',
                priceUnit: 'AED / MO',
                tagline: 'For solo operators or anyone trying Rezzy.',
                highlight: false,
                features: [
                  'Up to 50 bookings / month',
                  '1 staff member',
                  'Basic calendar (month/week/day)',
                  'Manual WhatsApp reminders',
                  'Bilingual interface (EN/AR)',
                  'Email support',
                ],
                cta: 'Start Free',
              },
              {
                name: 'Pro',
                price: '99',
                priceUnit: 'AED / MO',
                tagline: 'For active shops that need automation.',
                highlight: true,
                features: [
                  'Unlimited bookings',
                  'Up to 10 staff members',
                  'WhatsApp automation',
                  'Smart no-show reminders',
                  'Customer reviews & ratings',
                  'Staff performance analytics',
                  'Calendar sync (Google/Apple)',
                  'On-site setup support (UAE)',
                  'Priority email + chat support',
                ],
                cta: 'Start 14-day Trial',
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                priceUnit: '',
                tagline: 'For high-volume shops with custom needs.',
                highlight: false,
                features: [
                  'Everything in Pro',
                  'Unlimited staff',
                  'API access',
                  'White-label branding',
                  'Custom AI workflows',
                  'Dedicated account manager',
                  'Unlimited on-site support visits (UAE)',
                  'Priority support + SLA',
                  'Custom onboarding & training',
                ],
                cta: 'Contact Sales',
              },
            ].map((tier, i) => (
              <div
                key={i}
                className={`relative p-10 rounded-[40px] border transition-all duration-500 group cursor-default flex flex-col
                  ${tier.highlight
                    ? 'border-[#4b8eff] bg-[#4b8eff]/5 shadow-[0_0_50px_rgba(75,142,255,0.2)]'
                    : 'border-[#414755]/20 bg-[#151c25]/30 hover:border-[#414755]/60'
                  }
                `}
              >
                {tier.highlight && (
                  <div className="inline-block self-start px-3 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] text-[10px] font-black uppercase tracking-widest mb-4">
                    Most Popular
                  </div>
                )}
                <p className="text-[10px] font-black text-[#8b90a0] uppercase tracking-[0.3em] mb-3">{tier.name}</p>
                <p className="text-[#8b90a0] text-xs font-semibold mb-6 leading-relaxed">{tier.tagline}</p>
                <div className="flex items-baseline gap-2 mb-8 text-white">
                  <span className="text-5xl font-black tracking-tighter leading-none">{tier.price}</span>
                  {tier.priceUnit && <span className="text-xs font-bold text-[#8b90a0]">{tier.priceUnit}</span>}
                </div>
                <div className="space-y-3 mb-10 flex-1">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-3 text-[12px] font-bold text-white/70 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[#4edea3] text-[16px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className={`w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all
                  ${tier.highlight
                    ? 'bg-[#4b8eff] text-white hover:bg-[#4b8eff]/90'
                    : 'border border-[#414755] text-[#8b90a0] hover:text-white hover:bg-[#414755]/20'
                  }
                `}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FAQSection faqRef={faqRef} faqVisible={faqVisible} />

        {/* FINAL CTA */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
          <div className="p-10 md:p-16 rounded-[40px] text-center relative overflow-hidden border border-[#4b8eff]/20 bg-[#4b8eff]/5 hover:bg-[#4b8eff]/10 transition-all duration-700 group">
            {/* gradient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4b8eff]/10 via-transparent to-[#4edea3]/5 opacity-60 group-hover:opacity-100 transition-opacity" />
            {/* subtle corner glow */}
            <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-[#4b8eff]/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4edea3] mb-4">Ready when you are</p>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[0.95] italic">
                Scale your business.
              </h2>
              <p className="text-base md:text-lg font-semibold text-[#8b90a0] max-w-xl mx-auto leading-relaxed mb-10">
                Join 850+ UAE shop owners who replaced WhatsApp chaos with a system that actually works.
              </p>

              <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                 <a href="/register" className="inline-flex items-center justify-center h-14 px-10 rounded-2xl bg-[#4b8eff] text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#4b8eff]/30">
                  Register My Shop
                </a>
                <a href="https://wa.me/971557369629" className="inline-flex items-center justify-center h-14 px-10 rounded-2xl border border-[#414755] text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all">
                  Request a Demo
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[#8b90a0] text-[11px] font-bold">
                {[
                  { icon: 'credit_card_off', label: 'No card required' },
                  { icon: 'bolt', label: 'Setup in 30 minutes' },
                  { icon: 'cancel_schedule_send', label: 'Cancel anytime' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#4edea3] text-[14px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-20 border-t border-[#414755]/10 bg-[#080f17]/50 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-black text-white">REZZY<span className="text-[#4b8eff]">.</span></div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b90a0] hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b90a0] hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b90a0] hover:text-white transition-colors">FAQ</a>
            <a href="/privacy-policy" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b90a0] hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-[10px] font-bold text-[#414755] uppercase tracking-[0.2em] text-center">© 2026 Rezzy · Built in the UAE by Eloquent FZE LLC</p>
        </div>
      </footer>
    </div>
  );
}

function FAQSection({ faqRef, faqVisible }) {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Is there really a free plan?',
      a: 'Yes. Up to 50 bookings a month, no credit card, no time limit. Upgrade only if you grow past it.',
    },
    {
      q: 'Do I need a separate WhatsApp number?',
      a: 'No. Rezzy connects to your existing WhatsApp Business number.',
    },
    {
      q: 'How long does setup take?',
      a: "Most shops are taking bookings within 30 minutes. We'll guide you through every step.",
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. Cancel from your dashboard with one click. No questions, no fees.',
    },
    {
      q: 'Do you support Arabic?',
      a: 'Fully. The dashboard, customer-facing pages, and WhatsApp messages all work in Arabic and English.',
    },
    {
      q: 'Is my data safe?',
      a: 'Yes. All data is encrypted in transit and at rest. We never share customer information with third parties.',
    },
  ];

  return (
    <section
      id="faq"
      ref={faqRef}
      className={`max-w-4xl mx-auto px-6 mb-32 opacity-0 ${faqVisible ? 'animate-reveal' : ''}`}
    >
      <div className="text-center mb-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4b8eff] mb-4">FAQ</p>
        <h2 className="text-5xl font-black text-white tracking-tighter italic leading-tight">Questions, answered.</h2>
      </div>
      <div className="space-y-4">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-2xl border transition-all overflow-hidden
                ${isOpen
                  ? 'bg-[#151c25]/50 border-[#4b8eff]/30'
                  : 'bg-[#151c25]/30 border-[#414755]/20 hover:border-[#414755]/50'
                }
              `}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-6 p-6 text-left"
              >
                <h3 className="text-white font-black text-sm md:text-base tracking-tight">{item.q}</h3>
                <span
                  className={`material-symbols-outlined text-[#4b8eff] text-[24px] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                >
                  expand_more
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-[#8b90a0] text-sm font-medium leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
