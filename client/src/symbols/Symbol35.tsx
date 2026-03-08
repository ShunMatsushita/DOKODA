import { SymbolProps } from './index';
export default function Crown({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="10,70 15,30 30,50 50,20 70,50 85,30 90,70" fill="#FFD700" />
      <rect x="10" y="70" width="80" height="12" rx="3" fill="#FFC107" />
      <circle cx="50" cy="20" r="4" fill="#E91E63" />
      <circle cx="15" cy="30" r="3" fill="#E91E63" />
      <circle cx="85" cy="30" r="3" fill="#E91E63" />
      <circle cx="30" cy="76" r="4" fill="#E91E63" />
      <circle cx="50" cy="76" r="4" fill="#2196F3" />
      <circle cx="70" cy="76" r="4" fill="#E91E63" />
    </svg>
  );
}
