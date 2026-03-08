import { SymbolProps } from './index';
export default function Key({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="35" cy="35" r="18" fill="none" stroke="#FFB300" strokeWidth="8" />
      <rect x="48" y="31" width="40" height="8" rx="4" fill="#FFB300" />
      <rect x="75" y="39" width="8" height="14" rx="2" fill="#FFB300" />
      <rect x="65" y="39" width="8" height="10" rx="2" fill="#FFB300" />
    </svg>
  );
}
