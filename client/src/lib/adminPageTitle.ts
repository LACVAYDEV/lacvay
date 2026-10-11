import { adminNavItems } from '@/components/admin/AdminSidebar';

const FORM_TITLES: { pattern: RegExp; title: string; subtitle?: string }[] = [
  {
    pattern: /^\/admin\/places\/new$/,
    title: 'Add tourist spot',
    subtitle: 'Create a new destination for the app.',
  },
  {
    pattern: /^\/admin\/places\/[^/]+\/edit$/,
    title: 'Edit tourist spot',
    subtitle: 'Update destination details shown to travelers.',
  },
  {
    pattern: /^\/admin\/restaurants\/new$/,
    title: 'Add eatery',
    subtitle: 'Create a new dining listing for the app.',
  },
  {
    pattern: /^\/admin\/restaurants\/[^/]+\/edit$/,
    title: 'Edit eatery',
    subtitle: 'Update restaurant details shown to travelers.',
  },
  {
    pattern: /^\/admin\/promotions\/new$/,
    title: 'Create ad',
    subtitle: 'Publish a new promotion creative for travelers.',
  },
  {
    pattern: /^\/admin\/promotions\/[^/]+\/edit$/,
    title: 'Edit ad',
    subtitle: 'Update promotion details and media.',
  },
];

const SECTION_SUBTITLES: { pattern: RegExp; subtitle: string }[] = [
  { pattern: /^\/admin\/users$/, subtitle: 'Manage registered accounts and grant or revoke admin access.' },
  {
    pattern: /^\/admin\/places$/,
    subtitle: 'Browse destinations in a catalog view. Add new spots or open one for full details.',
  },
  {
    pattern: /^\/admin\/restaurants$/,
    subtitle: 'Browse restaurants in a catalog view. Add new listings or open one for full details.',
  },
  {
    pattern: /^\/admin\/promotions$/,
    subtitle: 'Manage ad creatives shown to travelers. Each promotion can include image or video media.',
  },
  {
    pattern: /^\/admin\/transit$/,
    subtitle: 'Browse Batangas City jeepney transit routes. Add new routes or open one to edit.',
  },
  {
    pattern: /^\/admin\/guides$/,
    subtitle: 'Manage global commute guides published for all LACVAY users.',
  },
];

function normalizeAdminPath(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/admin';
}

/** Resolve the admin section title from the current URL path. */
export function getAdminPageTitle(pathname: string): string {
  const path = normalizeAdminPath(pathname);

  for (const { pattern, title } of FORM_TITLES) {
    if (pattern.test(path)) return title;
  }

  const sorted = [...adminNavItems].sort((a, b) => b.to.length - a.to.length);
  for (const { to, label, end } of sorted) {
    if (end) {
      if (path === to) return label;
    } else if (path === to || path.startsWith(`${to}/`)) {
      return label;
    }
  }

  if (path.startsWith('/admin/guides')) return 'Commute Guides';

  return 'Dashboard';
}

/** Subtitle shown directly under the page title in the admin header. */
export function getAdminPageSubtitle(pathname: string): string | null {
  const path = normalizeAdminPath(pathname);

  if (path === '/admin') return null;

  for (const { pattern, subtitle } of FORM_TITLES) {
    if (pattern.test(path) && subtitle) return subtitle;
  }

  for (const { pattern, subtitle } of SECTION_SUBTITLES) {
    if (pattern.test(path)) return subtitle;
  }

  if (path.startsWith('/admin/guides')) {
    return 'Manage global commute guides published for all LACVAY users.';
  }

  return null;
}
