import { SymbolProps } from './index';
export default function Butterfly({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="35" cy="40" rx="20" ry="15" fill="#E040FB" />
      <ellipse cx="65" cy="40" rx="20" ry="15" fill="#7C4DFF" />
      <ellipse cx="35" cy="62" rx="15" ry="12" fill="#7C4DFF" />
      <ellipse cx="65" cy="62" rx="15" ry="12" fill="#E040FB" />
      <rect x="48" y="30" width="4" height="40" rx="2" fill="#333" />
      <line x1="50" y1="30" x2="40" y2="18" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="30" x2="60" y2="18" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="18" r="3" fill="#333" />
      <circle cx="60" cy="18" r="3" fill="#333" />
    </svg>
  );
}
