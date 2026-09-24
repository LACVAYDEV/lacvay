import type { ReactNode } from 'react';

interface PageTransitionProps {
  routeKey: string;
  children: ReactNode;
}

/** Remounts on route change and plays a short enter animation (see `.page-transition` in index.css). */
export function PageTransition({ routeKey, children }: PageTransitionProps) {
  return (
    <div key={routeKey} className="page-transition flex min-h-0 w-full flex-1 flex-col">
      {children}
    </div>
  );
}
