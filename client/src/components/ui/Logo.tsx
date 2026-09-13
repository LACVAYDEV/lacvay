interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <img
      src="/images/logo.jpg"
      alt="LACVAY Logo"
      className={className}
    />
  );
}

export function MapPinSolid({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 24 32" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 8.4 12 20 12 20s12-11.6 12-20c0-6.627-5.373-12-12-12Z"
        fill="#6B1B2E"
      />
      <circle cx="12" cy="11.5" r="4.6" fill="#fff" />
    </svg>
  );
}

export function PalmDecor({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 240 170" className={className} fill="none" aria-hidden="true">
      <ellipse cx="120" cy="180" rx="150" ry="70" fill="#FFFFFF" opacity="0.12" />
      <g opacity="0.3">
        <path d="M58 168c2-30 0-52-6-72" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <g fill="#FFFFFF">
          <path d="M52 96c-20-8-38-2-50 11 16 4 34 1 50-11Z" />
          <path d="M52 96c-16-16-36-19-52-13 14 12 34 19 52 13Z" />
          <path d="M52 96c-4-22-18-35-34-39 6 19 18 33 34 39Z" />
          <path d="M52 96c14-17 34-19 50-11-14 10-32 16-50 11Z" />
          <path d="M52 96c18-4 35 4 45 17-16 0-33-4-45-17Z" />
        </g>
      </g>
      <g opacity="0.18">
        <path d="M186 170c-1-24 1-42 6-58" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <g fill="#FFFFFF">
          <path d="M192 112c-15-6-28-1-37 8 12 3 25 1 37-8Z" />
          <path d="M192 112c-12-12-27-14-39-9 11 9 26 14 39 9Z" />
          <path d="M192 112c10-12 25-14 37-8-11 8-24 12-37 8Z" />
          <path d="M192 112c13-3 26 3 33 12-12 0-24-3-33-12Z" />
        </g>
      </g>
    </svg>
  );
}

/** Decorative sun-over-mountains waves for the sidebar footer, echoing the brand mark. */
export function SidebarWaveArt({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 240 130" className={className} fill="none" aria-hidden="true">
      <circle cx="176" cy="16" r="7" fill="#F3E4C8" />
      <g stroke="#F3E4C8" strokeWidth="2" strokeLinecap="round">
        <path d="M176 1v-6" />
        <path d="M176 31v6" />
        <path d="M161 16h-6" />
        <path d="M191 16h6" />
        <path d="M165.5 5.5l-4-4" />
        <path d="M186.5 26.5l4 4" />
        <path d="M186.5 5.5l4-4" />
        <path d="M165.5 26.5l-4 4" />
      </g>
      <path
        d="M112 44 L134 26 L150 40 L168 22 L200 44"
        stroke="#F3E4C8"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Back ribbon: navy fill with a cream crest, high on the left */}
      <path
        d="M-5 38 C 25 28, 50 28, 75 42 C 100 56, 122 58, 148 42 C 165 32, 182 24, 202 18 L 202 130 L -5 130 Z"
        fill="#123A5C"
      />
      <path
        d="M-5 38 C 25 28, 50 28, 75 42 C 100 56, 122 58, 148 42 C 165 32, 182 24, 202 18"
        stroke="#F3E4C8"
        strokeWidth="2"
        opacity="0.9"
      />

      {/* Middle ribbon: background-colored wave that crosses over the back ribbon */}
      <path
        d="M-5 78 C 22 66, 46 82, 72 70 C 100 57, 128 40, 158 54 C 178 64, 195 76, 212 84 L 212 130 L -5 130 Z"
        fill="#6B1B2E"
      />
      <path
        d="M-5 78 C 22 66, 46 82, 72 70 C 100 57, 128 40, 158 54 C 178 64, 195 76, 212 84"
        stroke="#FFFFFF"
        strokeWidth="2"
        opacity="0.85"
      />

      {/* Front ribbon: navy fill, deep dip on the left rising steeply on the right */}
      <path
        d="M-5 104 C 28 112, 62 98, 92 102 C 122 106, 150 92, 174 68 C 192 50, 210 40, 245 34 L 245 130 L -5 130 Z"
        fill="#123A5C"
      />
      <path
        d="M-5 104 C 28 112, 62 98, 92 102 C 122 106, 150 92, 174 68 C 192 50, 210 40, 245 34"
        stroke="#FFFFFF"
        strokeWidth="2.25"
        opacity="0.95"
      />
    </svg>
  );
}
