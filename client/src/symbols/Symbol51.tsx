import { SymbolProps } from './index';
export default function Shuriken({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="50,5 55,42 95,35 58,50 90,85 52,58 50,95 48,58 10,85 42,50 5,35 45,42" fill="#607D8B" />
      <circle cx="50" cy="50" r="8" fill="#37474F" />
      <circle cx="50" cy="50" r="4" fill="#90A4AE" />
    </svg>
  );
}
