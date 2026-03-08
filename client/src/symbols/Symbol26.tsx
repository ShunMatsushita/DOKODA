import { SymbolProps } from './index';
export default function Cake({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <rect x="20" y="50" width="60" height="25" rx="4" fill="#F48FB1" />
      <rect x="15" y="70" width="70" height="20" rx="4" fill="#EC407A" />
      <path d="M15 70 Q30 62 50 70 Q70 78 85 70" fill="#FFEB3B" />
      <rect x="48" y="30" width="4" height="22" fill="#FFD54F" />
      <ellipse cx="50" cy="28" rx="5" ry="7" fill="#FF9800" />
      <ellipse cx="50" cy="25" rx="3" ry="4" fill="#FFEB3B" />
    </svg>
  );
}
