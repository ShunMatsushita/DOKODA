import { SymbolProps } from './index';
export default function IceCream({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="35,55 65,55 50,95" fill="#D2691E" />
      <line x1="38" y1="58" x2="50" y2="92" stroke="#8B4513" strokeWidth="1" />
      <line x1="62" y1="58" x2="50" y2="92" stroke="#8B4513" strokeWidth="1" />
      <circle cx="40" cy="40" r="18" fill="#FF69B4" />
      <circle cx="60" cy="40" r="18" fill="#87CEEB" />
      <circle cx="50" cy="25" r="16" fill="#FFD700" />
    </svg>
  );
}
