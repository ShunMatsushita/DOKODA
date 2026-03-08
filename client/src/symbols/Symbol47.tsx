import { SymbolProps } from './index';
export default function Eye({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M5 50 Q30 20 50 20 Q70 20 95 50 Q70 80 50 80 Q30 80 5 50Z" fill="#FAFAFA" stroke="#333" strokeWidth="3" />
      <circle cx="50" cy="50" r="18" fill="#795548" />
      <circle cx="50" cy="50" r="10" fill="#333" />
      <circle cx="45" cy="44" r="4" fill="#FFF" />
    </svg>
  );
}
