import { SymbolProps } from './index';
export default function YinYang({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="40" fill="#FAFAFA" stroke="#333" strokeWidth="3" />
      <path d="M50 10 A40 40 0 0 1 50 90 A20 20 0 0 1 50 50 A20 20 0 0 0 50 10Z" fill="#333" />
      <circle cx="50" cy="30" r="7" fill="#FAFAFA" />
      <circle cx="50" cy="70" r="7" fill="#333" />
    </svg>
  );
}
