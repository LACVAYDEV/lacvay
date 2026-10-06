import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type AdminNavHeaderOverride = {
  title: string;
  subtitle?: string | null;
};

const AdminNavHeaderOverrideContext = createContext<((override: AdminNavHeaderOverride | null) => void) | null>(
  null,
);

export function AdminNavTitleOverrideProvider({
  setOverride,
  children,
}: {
  setOverride: (override: AdminNavHeaderOverride | null) => void;
  children: ReactNode;
}) {
  return (
    <AdminNavHeaderOverrideContext.Provider value={setOverride}>{children}</AdminNavHeaderOverrideContext.Provider>
  );
}

/** Temporarily replace the top-nav title and optional subtitle (e.g. transit add/edit view). */
export function useAdminNavTitle(title: string | null, subtitle?: string | null) {
  const setOverride = useContext(AdminNavHeaderOverrideContext);
  useEffect(() => {
    if (!setOverride) return;
    if (title === null) {
      setOverride(null);
      return;
    }
    setOverride({ title, subtitle: subtitle ?? null });
    return () => setOverride(null);
  }, [title, subtitle, setOverride]);
}
