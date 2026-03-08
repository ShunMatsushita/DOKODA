import { SymbolProps } from './index';
export default function Cherry({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 15 Q40 30 30 55" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 15 Q60 30 70 55" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 15 Q65 10 55 5" fill="#4CAF50" />
      <circle cx="30" cy="65" r="18" fill="#D32F2F" />
      <circle cx="70" cy="65" r="18" fill="#D32F2F" />
      <ellipse cx="24" cy="58" rx="4" ry="6" fill="#FF8A80" opacity="0.5" />
      <ellipse cx="64" cy="58" rx="4" ry="6" fill="#FF8A80" opacity="0.5" />
    </svg>
  );
}
