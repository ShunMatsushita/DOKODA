import { SymbolProps } from './index';
export default function Cat({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="25,35 35,10 45,35" fill="#FF8C00" />
      <polygon points="55,35 65,10 75,35" fill="#FF8C00" />
      <circle cx="50" cy="55" r="30" fill="#FF8C00" />
      <circle cx="40" cy="48" r="5" fill="#333" />
      <circle cx="60" cy="48" r="5" fill="#333" />
      <ellipse cx="50" cy="58" rx="4" ry="3" fill="#FF69B4" />
      <line x1="20" y1="55" x2="38" y2="55" stroke="#333" strokeWidth="2" />
      <line x1="62" y1="55" x2="80" y2="55" stroke="#333" strokeWidth="2" />
      <line x1="20" y1="50" x2="38" y2="52" stroke="#333" strokeWidth="2" />
      <line x1="62" y1="52" x2="80" y2="50" stroke="#333" strokeWidth="2" />
    </svg>
  );
}
