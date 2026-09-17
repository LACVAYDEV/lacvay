import Saved from './Saved';

export default function SavedPage({ defaultTab = 'places' }: { defaultTab?: 'places' | 'guides' }) {
  return <Saved defaultTab={defaultTab} />;
}
