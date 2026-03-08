import { SymbolProps } from './index';
export default function Fish({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="48" cy="50" rx="30" ry="18" fill="#2196F3" />
      <polygon points="78,50 95,35 95,65" fill="#2196F3" />
      <circle cx="35" cy="46" r="4" fill="#FFF" />
      <circle cx="36" cy="46" r="2" fill="#333" />
      <path d="M55 42 Q60 50 55 58" fill="none" stroke="#1565C0" strokeWidth="2" />
      <path d="M62 44 Q67 50 62 56" fill="none" stroke="#1565C0" strokeWidth="2" />
    </svg>
  );
}
