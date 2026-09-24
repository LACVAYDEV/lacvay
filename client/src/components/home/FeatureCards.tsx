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
    title: 'AI Travel Assistant',
    description: 'Get instant answers and personalized commute instructions tailored to your trip.',
    image: '/images/icon-ride.png',
    cta: 'Ask Assistant',
    path: '/ai-assistant',
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
