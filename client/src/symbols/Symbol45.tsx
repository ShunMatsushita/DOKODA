import { SymbolProps } from './index';
export default function Infinity({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 50 C50 30 20 20 20 50 C20 80 50 70 50 50 C50 30 80 20 80 50 C80 80 50 70 50 50Z" fill="none" stroke="#673AB7" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
