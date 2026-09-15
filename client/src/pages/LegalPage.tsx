import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const privacySections = [
  {
    title: 'Information we collect',
    paragraphs: [
      'LACVAY stores account information you provide, including your name and email address. If you use account features, we may also store saved places, chat history, travel-search history, and preference settings.',
      'Some preferences and recent activity are stored in your browser. Account history is synchronized to your account only when you enable history sync.',
    ],
  },
  {
    title: 'How information is used',
    paragraphs: [
      'We use this information to authenticate your account, provide requested travel features, remember your preferences, synchronize content you choose to save, maintain the service, and investigate errors or abuse.',
    ],
  },
  {
    title: 'Third-party services',
    paragraphs: [
      'LACVAY uses Supabase for authentication and account data, OpenStreetMap tiles for maps, Open-Meteo for weather, and may use Google Gemini to answer AI travel questions. Information you submit to those features may be processed by the relevant provider under its own terms and privacy practices.',
      'Links to ride providers and other external services open third-party websites or applications. LACVAY does not control their data practices.',
    ],
  },
  {
    title: 'Location and device permissions',
    paragraphs: [
      'Location access is requested only when a feature needs it and your browser or device controls the permission. LACVAY does not claim to continuously track your device location.',
    ],
  },
  {
    title: 'Retention and your choices',
    paragraphs: [
      'Browser-stored data remains until you remove it or clear your browser storage. Account data remains until it is deleted, subject to operational backups and legal requirements. You can disable history sync, remove history entries, sign out, or permanently delete your account from Settings.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'For privacy questions or requests that cannot be completed in Settings, contact the administrator or organization that provided access to this LACVAY deployment.',
    ],
  },
];

const termsSections = [
  {
    title: 'Using LACVAY',
    paragraphs: [
      'You may use LACVAY for lawful personal travel planning. You are responsible for protecting your account credentials and for activity performed through your account.',
    ],
  },
  {
    title: 'Travel information and estimates',
    paragraphs: [
      'Routes, fares, schedules, travel times, availability, business listings, and AI responses may be estimates or may change without notice. Confirm important details directly with drivers, operators, terminals, venues, or provider applications before traveling.',
      'LACVAY is not an emergency, dispatch, transportation, or booking service and does not guarantee that a route, vehicle, fare, destination, or provider will be safe, available, accurate, or suitable for you.',
    ],
  },
  {
    title: 'Third-party services',
    paragraphs: [
      'Links to maps, ride providers, restaurants, promotions, and other services are provided for convenience. Your use of a third-party service is governed by that provider’s terms, fees, availability, and policies.',
    ],
  },
  {
    title: 'Safety',
    paragraphs: [
      'Use licensed or platform-listed providers, verify driver and vehicle details, wear required safety equipment, and follow local laws. In an immediate emergency in the Philippines, call 911.',
    ],
  },
  {
    title: 'Acceptable use',
    paragraphs: [
      'Do not misuse the service, attempt unauthorized access, interfere with operation, submit unlawful content, impersonate others, or use LACVAY to harm another person.',
    ],
  },
  {
    title: 'Accounts and termination',
    paragraphs: [
      'You may delete your account from Settings. Account deletion is permanent and removes access to synchronized account data. We may restrict access when necessary to protect users, comply with law, or address misuse.',
    ],
  },
  {
    title: 'Changes',
    paragraphs: [
      'These terms and the service may change as LACVAY develops. Material revisions should be reflected by an updated date on this page.',
    ],
  },
];

export default function LegalPage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const intro = isPrivacy
    ? 'This policy explains what information LACVAY handles and the choices available to you.'
    : 'These terms explain the conditions for using the LACVAY travel assistant.';
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <main className="min-h-screen bg-lacvay-cream px-4 py-8 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-10">
        <Link to="/welcome" className="inline-flex items-center gap-2 text-sm font-semibold text-lacvay-green hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to LACVAY
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-wider text-lacvay-green">LACVAY</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{intro}</p>
        <p className="mt-2 text-xs text-gray-400">Last updated: September 15, 2026</p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
              <div className="mt-2 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-gray-600">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-100 pt-6 text-sm font-semibold">
          <Link to="/privacy" className="text-lacvay-green hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="text-lacvay-green hover:underline">Terms of Service</Link>
        </div>
      </article>
    </main>
  );
}
