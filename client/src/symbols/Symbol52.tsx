import { SymbolProps } from './index';
export default function Fan({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 85 L15 25 A42 42 0 0 1 85 25 Z" fill="#E91E63" />
      <line x1="50" y1="85" x2="25" y2="30" stroke="#C2185B" strokeWidth="1.5" />
      <line x1="50" y1="85" x2="35" y2="22" stroke="#C2185B" strokeWidth="1.5" />
      <line x1="50" y1="85" x2="50" y2="18" stroke="#C2185B" strokeWidth="1.5" />
      <line x1="50" y1="85" x2="65" y2="22" stroke="#C2185B" strokeWidth="1.5" />
      <line x1="50" y1="85" x2="75" y2="30" stroke="#C2185B" strokeWidth="1.5" />
      <circle cx="50" cy="85" r="5" fill="#8D6E63" />
    </svg>
  );
}
