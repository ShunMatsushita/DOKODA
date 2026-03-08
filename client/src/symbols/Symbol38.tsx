import { SymbolProps } from './index';
export default function Anchor({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="18" r="8" fill="none" stroke="#37474F" strokeWidth="5" />
      <line x1="50" y1="26" x2="50" y2="85" stroke="#37474F" strokeWidth="6" strokeLinecap="round" />
      <line x1="25" y1="55" x2="75" y2="55" stroke="#37474F" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 70 Q20 88 50 88 Q80 88 80 70" fill="none" stroke="#37474F" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
