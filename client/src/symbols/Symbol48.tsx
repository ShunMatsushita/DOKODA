import { SymbolProps } from './index';
export default function Torii({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <rect x="20" y="25" width="8" height="65" fill="#D32F2F" />
      <rect x="72" y="25" width="8" height="65" fill="#D32F2F" />
      <rect x="8" y="18" width="84" height="8" rx="2" fill="#D32F2F" />
      <path d="M5 14 Q50 5 95 14" fill="none" stroke="#D32F2F" strokeWidth="6" strokeLinecap="round" />
      <rect x="18" y="38" width="64" height="6" rx="2" fill="#D32F2F" />
    </svg>
  );
}
