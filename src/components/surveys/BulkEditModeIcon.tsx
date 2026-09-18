interface BulkEditModeIconProps {
  className?: string;
}

export function BulkEditModeIcon({ className }: BulkEditModeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1.4" y="3.4" width="15.4" height="16" rx="1.3" />
        <path d="M1.4 8h15.4" />
      </g>
      <g fill="currentColor">
        <circle cx="4.1" cy="5.7" r="0.8" />
        <circle cx="6.3" cy="5.7" r="0.8" />
        <circle cx="8.5" cy="5.7" r="0.8" />
      </g>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 11.8 3.3 13.8 5 15.8M7.9 11.3 6.4 16.3M9.9 11.8l1.8 2-1.8 2" />
      </g>
      <path
        fill="#fff"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.08 8.42 21.99 10.33 15.63 16.69 12.9 17.5 13.72 14.78Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M18.24 10.26 20.15 12.17"
      />
    </svg>
  );
}
