import { SymbolProps } from './index';
export default function Lantern({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <rect x="40" y="8" width="20" height="8" rx="2" fill="#333" />
      <line x1="50" y1="5" x2="50" y2="10" stroke="#333" strokeWidth="3" />
      <ellipse cx="50" cy="50" rx="28" ry="32" fill="#D32F2F" />
      <rect x="38" y="16" width="24" height="4" rx="2" fill="#B71C1C" />
      <rect x="38" y="80" width="24" height="4" rx="2" fill="#B71C1C" />
      <line x1="22" y1="50" x2="78" y2="50" stroke="#B71C1C" strokeWidth="2" opacity="0.5" />
      <line x1="25" y1="38" x2="75" y2="38" stroke="#B71C1C" strokeWidth="2" opacity="0.5" />
      <line x1="25" y1="62" x2="75" y2="62" stroke="#B71C1C" strokeWidth="2" opacity="0.5" />
      <rect x="44" y="84" width="12" height="8" fill="#FFD700" />
    </svg>
  );
}
