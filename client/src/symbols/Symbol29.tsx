import { SymbolProps } from './index';
export default function Ramen({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M15 40 Q20 10 30 40" fill="none" stroke="#BDBDBD" strokeWidth="2" />
      <path d="M30 40 Q35 10 45 40" fill="none" stroke="#BDBDBD" strokeWidth="2" />
      <path d="M10 45 L90 45 L80 80 Q75 90 50 90 Q25 90 20 80 Z" fill="#FF7043" />
      <path d="M25 55 Q35 65 45 55 Q55 45 65 55 Q75 65 80 55" fill="none" stroke="#FFECB3" strokeWidth="4" strokeLinecap="round" />
      <circle cx="65" cy="52" r="8" fill="#FFF9C4" stroke="#FBC02D" strokeWidth="1.5" />
      <rect x="8" y="42" width="84" height="6" rx="3" fill="#E64A19" />
    </svg>
  );
}
