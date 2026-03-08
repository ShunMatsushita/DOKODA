import { SymbolProps } from './index';
export default function Umbrella({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M10 50 A40 40 0 0 1 90 50 Z" fill="#E91E63" />
      <path d="M10 50 Q30 40 35 50" fill="#C2185B" />
      <path d="M35 50 Q50 40 55 50" fill="#E91E63" />
      <path d="M55 50 Q70 40 75 50" fill="#C2185B" />
      <path d="M75 50 Q85 40 90 50" fill="#E91E63" />
      <line x1="50" y1="15" x2="50" y2="80" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 80 Q50 90 42 88" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
