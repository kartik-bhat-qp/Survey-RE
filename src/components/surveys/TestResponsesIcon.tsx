interface TestResponsesIconProps {
  className?: string;
}

/** Flask with sample drops — generate mock survey responses for testing. */
export function TestResponsesIcon({ className }: TestResponsesIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M9 3h6v1.75h-1.1v3.05l1.72 3.05H8.38L10.1 7.8V4.75H9V3Zm-4.12 15.2 2.7-4.8h8.84l2.7 4.8A2.15 2.15 0 0 1 17.3 21.5H6.7a2.15 2.15 0 0 1-1.82-3.3Z" />
      <circle cx="9.35" cy="16.85" r="1.05" fill="#fff" />
      <circle cx="12.15" cy="18.35" r="0.85" fill="#fff" />
      <circle cx="14.85" cy="16.55" r="1.05" fill="#fff" />
    </svg>
  );
}
