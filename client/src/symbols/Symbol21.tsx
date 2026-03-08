import { SymbolProps } from './index';
export default function Snake({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M20 30 Q40 10 50 30 Q60 50 40 55 Q20 60 30 75 Q40 90 60 85 Q80 80 85 65" fill="none" stroke="#4CAF50" strokeWidth="10" strokeLinecap="round" />
      <circle cx="20" cy="30" r="8" fill="#4CAF50" />
      <circle cx="16" cy="28" r="2.5" fill="#333" />
      <circle cx="24" cy="28" r="2.5" fill="#333" />
      <path d="M18 35 L20 40 L22 35" fill="#E53935" />
    </svg>
  );
}
