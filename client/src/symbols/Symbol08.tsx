import { SymbolProps } from './index';
export default function Wave({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M5 50 Q20 30 35 50 Q50 70 65 50 Q80 30 95 50" fill="none" stroke="#1E90FF" strokeWidth="6" strokeLinecap="round" />
      <path d="M5 65 Q20 45 35 65 Q50 85 65 65 Q80 45 95 65" fill="none" stroke="#4169E1" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
