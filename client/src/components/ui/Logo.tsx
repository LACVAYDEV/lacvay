import { cn } from '@/lib/utils';

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <img
      src="/images/lacvay-logo.png"
      alt="LACVAY Logo"
      className={cn('h-auto w-auto shrink-0 object-contain', className)}
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
    <svg
      viewBox="0 0 248 86"
      preserveAspectRatio="none"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="186" cy="20" r="6" fill="#F3E4C8" />
      <g stroke="#F3E4C8" strokeWidth="1.75" strokeLinecap="round">
        <path d="M186 8v-4" />
        <path d="M186 32v4" />
        <path d="M174 20h-4" />
        <path d="M198 20h4" />
        <path d="M177.5 11.5l-3-3" />
        <path d="M194.5 28.5l3 3" />
        <path d="M194.5 11.5l3-3" />
        <path d="M177.5 28.5l-3 3" />
      </g>
      <path
        d="M122 36 L142 22 L156 34 L172 18 L202 36"
        stroke="#F3E4C8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      <path
        d="M0 32 C 32 24, 58 24, 84 36 C 110 48, 132 50, 158 36 C 176 26, 196 18, 248 14 L 248 86 L 0 86 Z"
        fill="#123A5C"
      />
      <path
        d="M0 32 C 32 24, 58 24, 84 36 C 110 48, 132 50, 158 36 C 176 26, 196 18, 248 14"
        stroke="#F3E4C8"
        strokeWidth="2"
        opacity="0.9"
      />

      <path
        d="M0 54 C 28 44, 52 58, 78 48 C 106 36, 134 24, 164 36 C 184 44, 210 56, 248 62 L 248 86 L 0 86 Z"
        fill="#6B1B2E"
      />
      <path
        d="M0 54 C 28 44, 52 58, 78 48 C 106 36, 134 24, 164 36 C 184 44, 210 56, 248 62"
        stroke="#FFFFFF"
        strokeWidth="2"
        opacity="0.85"
      />

      <path
        d="M0 70 C 32 76, 64 66, 94 68 C 124 70, 152 60, 176 44 C 194 32, 216 24, 248 22 L 248 86 L 0 86 Z"
        fill="#123A5C"
      />
      <path
        d="M0 70 C 32 76, 64 66, 94 68 C 124 70, 152 60, 176 44 C 194 32, 216 24, 248 22"
        stroke="#FFFFFF"
        strokeWidth="2.25"
        opacity="0.95"
      />
    </svg>
  );
}
