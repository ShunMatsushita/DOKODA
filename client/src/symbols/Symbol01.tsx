import { SymbolProps } from './index';
export default function Moon({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="45" cy="50" r="28" fill="#F4E04D" />
      <circle cx="58" cy="42" r="22" fill="#1a1a2e" />
    </svg>
  );
}
