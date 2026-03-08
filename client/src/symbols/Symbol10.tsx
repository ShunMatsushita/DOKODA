import { SymbolProps } from './index';
export default function Lightning({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="55,5 25,50 45,50 35,95 75,42 52,42 65,5" fill="#FFC107" stroke="#FF9800" strokeWidth="2" />
    </svg>
  );
}
