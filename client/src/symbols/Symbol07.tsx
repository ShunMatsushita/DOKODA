import { SymbolProps } from './index';
export default function Leaf({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 15 C20 30 15 70 50 90 C85 70 80 30 50 15Z" fill="#32CD32" />
      <line x1="50" y1="30" x2="50" y2="85" stroke="#228B22" strokeWidth="3" />
      <line x1="50" y1="50" x2="35" y2="40" stroke="#228B22" strokeWidth="2" />
      <line x1="50" y1="60" x2="65" y2="50" stroke="#228B22" strokeWidth="2" />
    </svg>
  );
}
