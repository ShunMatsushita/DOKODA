import { SymbolProps } from './index';
export default function Whale({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 20 Q60 10 55 5 Q58 12 65 15" fill="none" stroke="#64B5F6" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="50" cy="55" rx="38" ry="25" fill="#1976D2" />
      <ellipse cx="50" cy="62" rx="30" ry="14" fill="#BBDEFB" />
      <circle cx="28" cy="48" r="4" fill="#FFF" />
      <circle cx="29" cy="48" r="2" fill="#333" />
      <path d="M88 50 Q98 40 95 55 Q92 45 88 55" fill="#1976D2" />
    </svg>
  );
}
