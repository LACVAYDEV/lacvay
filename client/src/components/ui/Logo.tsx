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
        fill="#159447"
      />
      <circle cx="12" cy="11.5" r="4.6" fill="#fff" />
    </svg>
  );
}

export function PalmDecor({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 240 170" className={className} fill="none" aria-hidden="true">
      <ellipse cx="120" cy="180" rx="150" ry="70" fill="#C8E82A" opacity="0.18" />
      <g opacity="0.35">
        <path d="M58 168c2-30 0-52-6-72" stroke="#159447" strokeWidth="4" strokeLinecap="round" />
        <g fill="#159447">
          <path d="M52 96c-20-8-38-2-50 11 16 4 34 1 50-11Z" />
          <path d="M52 96c-16-16-36-19-52-13 14 12 34 19 52 13Z" />
          <path d="M52 96c-4-22-18-35-34-39 6 19 18 33 34 39Z" />
          <path d="M52 96c14-17 34-19 50-11-14 10-32 16-50 11Z" />
          <path d="M52 96c18-4 35 4 45 17-16 0-33-4-45-17Z" />
        </g>
      </g>
      <g opacity="0.22">
        <path d="M186 170c-1-24 1-42 6-58" stroke="#159447" strokeWidth="3" strokeLinecap="round" />
        <g fill="#159447">
          <path d="M192 112c-15-6-28-1-37 8 12 3 25 1 37-8Z" />
          <path d="M192 112c-12-12-27-14-39-9 11 9 26 14 39 9Z" />
          <path d="M192 112c10-12 25-14 37-8-11 8-24 12-37 8Z" />
          <path d="M192 112c13-3 26 3 33 12-12 0-24-3-33-12Z" />
        </g>
      </g>
    </svg>
  );
}
