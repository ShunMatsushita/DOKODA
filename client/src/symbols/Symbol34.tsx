import { SymbolProps } from './index';
export default function Glasses({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="32" cy="50" r="18" fill="none" stroke="#1565C0" strokeWidth="5" />
      <circle cx="68" cy="50" r="18" fill="none" stroke="#1565C0" strokeWidth="5" />
      <path d="M50 50 Q50 45 50 50" fill="none" stroke="#1565C0" strokeWidth="5" />
      <line x1="50" y1="48" x2="50" y2="48" stroke="#1565C0" strokeWidth="5" />
      <path d="M49 48 L51 48" stroke="#1565C0" strokeWidth="5" strokeLinecap="round" />
      <line x1="14" y1="45" x2="5" y2="42" stroke="#1565C0" strokeWidth="4" strokeLinecap="round" />
      <line x1="86" y1="45" x2="95" y2="42" stroke="#1565C0" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
