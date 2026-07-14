interface SearchReplaceIconProps {
  className?: string;
}

export function SearchReplaceIcon({ className }: SearchReplaceIconProps) {
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
      <path d="M11 6C13.76 6 16 8.24 16 11C16 11.68 15.83 12.31 15.59 12.9L17.12 14.43C17.68 13.4 18 12.23 18 11C18 7.13 14.87 4 11 4V1L7 5L11 9V6ZM11 16C8.24 16 6 13.76 6 11C6 10.32 6.17 9.69 6.41 9.1L4.88 7.57C4.32 8.6 4 9.77 4 11C4 14.87 7.13 18 11 18V21L15 17L11 13V16Z" />
    </svg>
  );
}
