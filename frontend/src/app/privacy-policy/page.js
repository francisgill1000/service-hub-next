// app/privacy-policy/page.js (or page.jsx)

// NOTE: Metadata remains static for SEO consistency.
// We are only changing the internal lastUpdated variable.
export const metadata = {
  title: 'Privacy Policy | REZZY Booking Solution',
  description: 'Learn how REZZY, powered by Eloquent, collects and protects your personal information.',
  alternates: {
    canonical: 'https://rezzy.eloquentservice.com/privacy-policy' // Ensure this matches your true canonical domain
  }
}

export default function PrivacyPolicyPage() {
  
  // *** DYNAMIC DATE LOGIC ***
  // This calculates today's date on every page load (SSR or client-side).
  const today = new Date();
  
  // Configure the date format (e.g., "April 27, 2026")
  const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  
  // Generate the formatted string. The first parameter ('en-US') sets the language/format.
  const dynamicLastUpdated = today.toLocaleDateString('en-US', dateFormatOptions);
  
  return (
    <main className="container mx-auto px-6 py-12 md:px-12 md:py-16 text-gray-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="border-b pb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-950">
            REZZY Privacy Policy
          </h1>
          {/* We now use the dynamic variable here */}
          <p className="text-sm text-gray-500 mt-2">Last Updated: {dynamicLastUpdated}</p>
        </header>
        
        <p className="text-lg leading-relaxed">
          At REZZY ("we," "us," "our"), powered by Eloquent Service, we prioritize your privacy. This Privacy Policy describes how we collect, use, and share information when you use our lead forms on Meta Platforms (Facebook, Instagram) and when you interact with us via WhatsApp, or use our high-speed booking solutions ("the Service").
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900 border-l-4 border-emerald-500 pl-3">
            1. Information We Collect
          </h2>
          <p className="leading-relaxed">We may collect the following information from you when you submit a lead form through our ads on Meta Platforms:</p>
          <ul className="list-disc list-inside pl-5 space-y-2 text-gray-700">
            <li><strong className="text-gray-900">Contact Information:</strong> Your name and WhatsApp phone number (required for our communication).</li>
            <li><strong className="text-gray-900">Demographic Information:</strong> Your city of residence or business operation (as you specified in our lead ad questionnaire).</li>
            <li><strong className="text-gray-900">Usage Data:</strong> Information you voluntarily provide regarding your service needs (e.g., industry, goal).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900 border-l-4 border-emerald-500 pl-3">
            2. How We Use Your Information
          </h2>
          <p className="leading-relaxed">We use the collected information for the following purposes:</p>
          <ul className="list-disc list-inside pl-5 space-y-2 text-gray-700">
            <li>To initiate communication with you via WhatsApp regarding our Service.</li>
            <li>To provide you with information, demos, and support regarding REZZY booking solutions.</li>
            <li>To qualification leads and understand your specific booking friction points.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900 border-l-4 border-emerald-500 pl-3">
            3. Information Sharing
          </h2>
          <p className="leading-relaxed">We will **never sell or rent** your personal information to third parties. We share information only in limited circumstances:</p>
          <ul className="list-disc list-inside pl-5 space-y-2 text-gray-700">
            <li><strong className="text-gray-900">With Eloquent Service (Parent Company):</strong> To process your request and provide technical support.</li>
            <li><strong className="text-gray-900">As Required by Law:</strong> We may disclose information to comply with UAE laws or legal processed served upon us.</li>
          </ul>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900 border-l-4 border-emerald-500 pl-3">
            4. Third-Party Platforms (Meta & WhatsApp)
          </h2>
          <p className="leading-relaxed">
            Please be aware that your use of our lead forms is subject to Meta Platforms' (Facebook, Instagram) Privacy Policies. Our initial contact with you will be through WhatsApp. Your use of WhatsApp is subject to WhatsApp's Terms of Service and Privacy Policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900 border-l-4 border-emerald-500 pl-3">
            5. Your Rights & Data Retention
          </h2>
          <p className="leading-relaxed">
            You have the right to access the personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you wish to exercise this right, please contact us through the WhatsApp contact method provided in the Service.
          </p>
          <p>We retain lead information only for as long as necessary to initiate the requested service or process your request, up to a maximum of 6 months.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900 border-l-4 border-emerald-500 pl-3">
            6. Changes to This Privacy Policy
          </h2>
          <p className="leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-900 border-l-4 border-emerald-500 pl-3">
            7. Contact Us
          </h2>
          <p className="leading-relaxed">If you have any questions about this Privacy Policy, please contact us:</p>
          <ul className="list-disc list-inside pl-5 space-y-2 text-gray-700">
            <li>Via WhatsApp: <strong className="text-gray-900">+971 55 736 9629</strong></li>
            <li>Website: rezzy.eloquentservice.com</li>
          
          </ul>
        </section>
        
        <footer className="text-center pt-8 border-t mt-12 text-sm text-gray-500">
          © {today.getFullYear()} REZZY PROTOCOL. Powered by Eloquent Service, UAE.
        </footer>
        
      </div>
    </main>
  )
}