export const metadata = {
  title: 'Privacy Policy | REZZY Booking Solution',
  description: 'Learn how REZZY, powered by Eloquent, collects and protects your personal information.',
  alternates: {
    canonical: 'https://rezzy.eloquentservice.com/privacy-policy'
  }
};

const CONTACT_EMAIL = 'info@eloquentservice.com';
const CONTACT_WHATSAPP_DISPLAY = '+971 55 736 9629';
const CONTACT_WHATSAPP_LINK = 'https://wa.me/971557369629';
const WEBSITE_DISPLAY = 'rezzy.eloquentservice.com';
const WEBSITE_LINK = 'https://rezzy.eloquentservice.com';

const sections = [
  {
    n: '01',
    title: 'Information We Collect',
    intro: 'We may collect the following information from you when you submit a lead form through our ads on Meta Platforms (Facebook, Instagram) or otherwise interact with the Service:',
    items: [
      { label: 'Contact Information', body: 'Your name, WhatsApp phone number, and email address (required for our communication).' },
      { label: 'Demographic Information', body: 'Your city of residence or business operation as specified in our lead ad questionnaire.' },
      { label: 'Usage Data', body: 'Information you voluntarily provide regarding your service needs (e.g., industry, business goal, current booking volume).' },
      { label: 'Technical Data', body: 'IP address, browser type, device identifiers, and pages visited — collected automatically when you use our website.' },
    ],
  },
  {
    n: '02',
    title: 'How We Use Your Information',
    intro: 'We use the collected information for the following purposes:',
    items: [
      { body: 'To initiate and continue communication with you via WhatsApp or email regarding our Service.' },
      { body: 'To provide information, demos, onboarding, and support for REZZY booking solutions.' },
      { body: 'To qualify leads and understand your specific booking friction points.' },
      { body: 'To improve our Service, troubleshoot issues, and prevent fraud or abuse.' },
    ],
  },
  {
    n: '03',
    title: 'Legal Basis & Consent',
    paragraphs: [
      'We process your personal information based on the consent you provide when you submit a Meta Lead Ad form, contact us through WhatsApp, or sign up directly on our website. By submitting your information, you agree to be contacted by us about REZZY.',
      'You may withdraw your consent at any time using the opt-out methods described in Section 09. Withdrawing consent will not affect the lawfulness of processing carried out before your withdrawal.',
    ],
  },
  {
    n: '04',
    title: 'Information Sharing',
    intro: 'We will never sell or rent your personal information to third parties. We share information only in limited circumstances:',
    items: [
      { label: 'With Eloquent Service (Parent Company)', body: 'To process your request and provide technical support.' },
      { label: 'With Service Providers', body: 'Trusted vendors who help us run the Service (e.g., cloud hosting, email delivery, customer messaging) — bound by confidentiality and processing agreements.' },
      { label: 'As Required by Law', body: 'We may disclose information to comply with UAE laws, court orders, or legal processes served upon us.' },
    ],
  },
  {
    n: '05',
    title: 'Third-Party Platforms (Meta & WhatsApp)',
    paragraphs: [
      "Your use of our lead forms is subject to Meta Platforms' (Facebook, Instagram) Privacy Policies. Our initial contact with you will typically be through WhatsApp; your use of WhatsApp is subject to WhatsApp's Terms of Service and Privacy Policy.",
      'REZZY is not responsible for the privacy practices of Meta, WhatsApp, or other third-party platforms. We encourage you to review their policies separately.',
    ],
  },
  {
    n: '06',
    title: 'Cookies & Tracking',
    paragraphs: [
      'Our website uses cookies and similar technologies (such as browser local storage) to keep you signed in, remember your preferences, and understand how the Service is used.',
      'We use a small number of essential cookies for authentication and a limited set of analytics cookies to measure traffic. We do not use cookies to track you across other websites.',
      'You can disable cookies in your browser settings, but doing so may affect your ability to sign in to the Service.',
    ],
  },
  {
    n: '07',
    title: 'Data Security',
    paragraphs: [
      'We protect your personal information using industry-standard safeguards. Data is encrypted in transit using TLS, and sensitive data is encrypted at rest in our databases.',
      'Access to personal information is limited to authorized personnel who need it to operate or support the Service. While no system is 100% secure, we work continuously to strengthen our security practices.',
    ],
  },
  {
    n: '08',
    title: 'Data Retention',
    paragraphs: [
      'We retain lead information only for as long as necessary to fulfill the purposes outlined in this Policy, up to a maximum of 6 months from your last interaction with us — unless you become a customer, in which case we retain your account data for the duration of your subscription plus any period required by applicable law (typically up to 7 years for financial records).',
      'When data is no longer needed, it is deleted or fully anonymized.',
    ],
  },
  {
    n: '09',
    title: 'Your Rights & How to Opt Out',
    intro: 'You have the right to:',
    items: [
      { body: 'Access the personal information we hold about you.' },
      { body: 'Request that we correct or update inaccurate information.' },
      { body: 'Request deletion of your personal information ("right to be forgotten").' },
      { body: 'Withdraw consent and stop receiving messages from us at any time.' },
    ],
    afterParagraphs: [
      `To exercise any of these rights, email us at ${CONTACT_EMAIL} or reply "STOP" to any WhatsApp message from REZZY. We will action your request within a reasonable timeframe and confirm by email.`,
    ],
  },
  {
    n: '10',
    title: "Children's Privacy",
    paragraphs: [
      'The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us at ' + CONTACT_EMAIL + ' and we will delete it promptly.',
    ],
  },
  {
    n: '11',
    title: 'Changes to This Privacy Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. When we do, we will post the new Policy on this page and update the "Last Updated" date at the top. Material changes will be communicated to existing customers by email or in-app notice.',
    ],
  },
  {
    n: '12',
    title: 'Contact Us',
    intro: 'If you have any questions about this Privacy Policy or want to exercise your rights, please contact us:',
    contacts: [
      { icon: 'mail', label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
      { icon: 'chat', label: 'WhatsApp', value: CONTACT_WHATSAPP_DISPLAY, href: CONTACT_WHATSAPP_LINK },
      { icon: 'language', label: 'Website', value: WEBSITE_DISPLAY, href: WEBSITE_LINK },
    ],
  },
];

export default function PrivacyPolicyPage() {
  const today = new Date();
  const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const dynamicLastUpdated = today.toLocaleDateString('en-US', dateFormatOptions);

  return (
    <div className="min-h-screen relative bg-[#0d141d] text-[#dce3f0] overflow-x-hidden selection:bg-[#4b8eff] selection:text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 landing-bg-grid pointer-events-none opacity-40" />
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#4b8eff]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 z-[100] w-full h-20 flex items-center justify-between px-6 md:px-12 bg-[#0d141d]/80 backdrop-blur-md border-b border-[#414755]/20">
        <a href="/" className="text-2xl font-black tracking-tighter text-[#4b8eff] hover:scale-105 transition-transform cursor-pointer">REZZY</a>
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'features', href: '/#features' },
            { label: 'pricing', href: '/#pricing' },
            { label: 'faq', href: '/#faq' },
          ].map((link) => (
            <a key={link.label} href={link.href} className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] hover:text-white transition-all hover:-translate-y-0.5">
              {link.label}
            </a>
          ))}
          <a href="/login" className="h-10 px-6 rounded-xl bg-[#4b8eff] text-white font-black text-xs uppercase tracking-widest hover:bg-[#4b8eff]/90 hover:shadow-[0_0_20px_rgba(75,142,255,0.3)] transition-all flex items-center">
            Dashboard
          </a>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <header className="mb-16 text-center">
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full border border-[#4b8eff]/30 bg-[#4b8eff]/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4edea3]">Legal</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] mb-6">
              Privacy <br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #4b8eff' }}>Policy.</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b90a0]">
              Last Updated · {dynamicLastUpdated}
            </p>
          </header>

          {/* Intro */}
          <div className="mb-12 p-8 rounded-2xl bg-[#151c25]/30 border border-[#414755]/20">
            <p className="text-base md:text-lg font-medium leading-relaxed text-[#dce3f0]">
              At <span className="text-white font-black">REZZY</span> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), powered by Eloquent Service, we prioritize your privacy. This Privacy Policy describes how we collect, use, and share information when you use our lead forms on Meta Platforms (Facebook, Instagram), interact with us via WhatsApp, or use our high-speed booking solutions (&ldquo;the Service&rdquo;).
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section) => (
              <section
                key={section.n}
                className="relative p-8 md:p-10 rounded-2xl bg-[#151c25]/30 border border-[#414755]/20 hover:border-[#4b8eff]/30 transition-all overflow-hidden group"
              >
                <p className="absolute -right-2 -bottom-8 text-[140px] font-black text-[#4b8eff]/[0.05] tracking-tighter leading-none pointer-events-none select-none group-hover:text-[#4b8eff]/[0.08] transition-colors">
                  {section.n}
                </p>

                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4b8eff] mb-3">
                    Section {section.n}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-6 leading-tight">
                    {section.title}
                  </h2>

                  {section.intro && (
                    <p className="text-[#dce3f0] text-sm md:text-base leading-relaxed mb-5">
                      {section.intro}
                    </p>
                  )}

                  {section.paragraphs?.map((p, i) => (
                    <p key={i} className="text-[#dce3f0] text-sm md:text-base leading-relaxed mb-4 last:mb-0">
                      {p}
                    </p>
                  ))}

                  {section.items && (
                    <ul className="space-y-3">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm md:text-base text-[#dce3f0]">
                          <span
                            className="material-symbols-outlined text-[#4edea3] text-[18px] mt-0.5 shrink-0"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                          <span className="leading-relaxed">
                            {item.label && (
                              <span className="text-white font-black">{item.label}: </span>
                            )}
                            {item.body}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.afterParagraphs?.map((p, i) => (
                    <p key={i} className="text-[#dce3f0] text-sm md:text-base leading-relaxed mt-5">
                      {p}
                    </p>
                  ))}

                  {section.contacts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {section.contacts.map((c) => (
                        <a
                          key={c.label}
                          href={c.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-5 rounded-xl bg-[#080f17] border border-[#414755]/30 hover:border-[#4b8eff]/40 hover:bg-[#080f17]/70 transition-all flex items-center gap-4 group/card"
                        >
                          <div className="size-11 rounded-xl bg-[#4b8eff]/10 border border-[#4b8eff]/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[#4b8eff] text-[20px]">{c.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] mb-1">{c.label}</p>
                            <p className="text-sm font-black text-white truncate group-hover/card:text-[#4b8eff] transition-colors">{c.value}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Back to home CTA */}
          <div className="mt-16 text-center">
            <a
              href="/"
              className="inline-flex items-center justify-center h-14 px-10 rounded-2xl bg-[#4b8eff] text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#4b8eff]/20"
            >
              Back to Home
            </a>
          </div>

        </div>
      </main>

      <footer className="py-20 border-t border-[#414755]/10 bg-[#080f17]/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-black text-white">REZZY<span className="text-[#4b8eff]">.</span></div>
          <div className="flex items-center gap-8">
            <a href="/privacy-policy" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b90a0] hover:text-white transition-colors">Privacy</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b90a0] hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-[10px] font-bold text-[#414755] uppercase tracking-[0.2em] text-center">
            © {today.getFullYear()} REZZY · Powered by Eloquent Service, UAE
          </p>
        </div>
      </footer>
    </div>
  );
}
