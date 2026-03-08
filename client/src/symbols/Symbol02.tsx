import { SymbolProps } from './index';
export default function Star({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="50,10 61,40 95,40 68,58 78,90 50,72 22,90 32,58 5,40 39,40" fill="#FF6B35" />
    </svg>
  );
}
