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
    description: 'Learn how to commute by jeepney, tricycle, taxi, or motorcycle rider.',
    image: '/images/icon-commute.png',
    cta: 'View Guide',
    path: '/commute',
  },
  {
    title: 'Transport Checker',
    description: 'Check available transport routes, fixed fares, and view on map.',
    image: '/images/icon-fare.png',
    cta: 'Check Transport',
    path: '/fares',
  },
  {
    title: 'Ride Guide',
    description: 'Step-by-step instructions for booking Angkas, Grab, and local taxis.',
    image: '/images/icon-ride.png',
    cta: 'View Guide',
    path: '/rides',
  },
];

export function FeatureCards() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f) => (
        <button
          key={f.title}
          type="button"
          onClick={() => navigate(f.path)}
          className="group flex flex-col rounded-[22px] bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lacvay-blush">
            <img src={f.image} alt="" className="h-9 w-9 object-contain mix-blend-multiply" />
          </div>
          <h3 className="text-[14px] font-bold text-gray-900">{f.title}</h3>
          <p className="mt-1.5 flex-1 text-[11.5px] leading-relaxed text-gray-500">{f.description}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-lacvay-green">
            {f.cta}
            <span className="transition group-hover:translate-x-0.5">→</span>
          </span>
        </button>
      ))}
    </div>
  );
}
