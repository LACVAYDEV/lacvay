import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'Map & Routes',
    description: 'View routes, jeepney stops, and landmarks around Batangas City.',
    image: '/images/icon-map.png',
    cta: 'Open Map',
    path: '/map',
  },
  {
    title: 'Commute Guide',
    description: 'Step-by-step commute planning, jeepney transfers, and ride-hailing connections.',
    image: '/images/icon-commute.png',
    cta: 'View Guide',
    path: '/commute',
  },
  {
    title: 'Fares & Corridors',
    description: 'Check official fixed fares and jeepney corridors directly on the map.',
    image: '/images/icon-fare.png',
    cta: 'Explore Map',
    path: '/map',
  },
  {
    title: 'LACVAY AI',
    description: 'Get instant answers and personalized commute instructions tailored to your trip.',
    image: '/images/icon-ride.png',
    cta: 'Ask LACVAY AI',
    path: '/ai-assistant',
  },
];

export function FeatureCards() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
      {features.map((f) => (
        <button
          key={f.title}
          type="button"
          onClick={() => navigate(f.path)}
          className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white p-3 sm:p-4 text-left shadow-sm transition duration-200 hover:border-lacvay-green/30"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-lacvay-blush/70 opacity-0 transition duration-300 group-hover:opacity-100"
          />
          <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-lacvay-blush transition group-hover:bg-lacvay-yellow/30">
            <img src={f.image} alt="" className="h-7 w-7 object-contain mix-blend-multiply" />
          </div>
          <h3 className="relative text-[14px] font-bold text-gray-900 transition group-hover:text-lacvay-green">
            {f.title}
          </h3>
          <p className="relative mt-1.5 flex-1 text-[11.5px] leading-relaxed text-gray-500">{f.description}</p>
          <span className="relative mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-lacvay-green">
            {f.cta}
            <span className="transition group-hover:translate-x-1">→</span>
          </span>
        </button>
      ))}
    </div>
  );
}
