import { SymbolProps } from './index';
export default function Apple({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 18 Q55 5 60 15" fill="none" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
      <path d="M52 22 Q65 15 60 22" fill="#4CAF50" />
      <path d="M50 25 C25 25 10 50 20 70 C30 92 45 92 50 85 C55 92 70 92 80 70 C90 50 75 25 50 25Z" fill="#F44336" />
      <ellipse cx="38" cy="45" rx="6" ry="10" fill="#FF8A80" opacity="0.5" />
    </svg>
  );
}
