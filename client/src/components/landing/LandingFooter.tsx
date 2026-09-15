import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/ui/Logo';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Destinations', href: '#destinations' },
      { label: 'Why LACVAY', href: '#why-lacvay' },
    ],
  },
  {
    title: 'Travel',
    links: [
      { label: 'Map & Routes', href: '#features' },
      { label: 'Fare Checker', href: '#features' },
      { label: 'Commute Guide', href: '#features' },
      { label: 'Ride Guide', href: '#features' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-12" />
              <span className="text-[19px] font-extrabold tracking-tight text-lacvay-green">LACVAY</span>
            </div>
            <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-gray-600">
              Your local travel and transportation assistant for Batangas City, Batangas,
              Philippines.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-900">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[12.5px] text-gray-600 transition hover:text-lacvay-green">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <p className="text-[11.5px] text-gray-500">
            © {new Date().getFullYear()} LACVAY. Built for Batangas City.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="text-[11.5px] font-semibold text-lacvay-green hover:underline">
              Sign In
            </Link>
            <Link to="/signup" className="text-[11.5px] font-semibold text-lacvay-green hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
