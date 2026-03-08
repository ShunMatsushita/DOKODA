import { SymbolProps } from './index';
export default function Bell({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 10 L50 18" stroke="#FFB300" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 18 C30 18 20 38 20 55 L20 65 L80 65 L80 55 C80 38 70 18 50 18Z" fill="#FFC107" />
      <rect x="15" y="65" width="70" height="8" rx="4" fill="#FFB300" />
      <circle cx="50" cy="80" r="8" fill="#FFB300" />
    </svg>
  );
}
