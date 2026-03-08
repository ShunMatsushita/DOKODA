import { SymbolProps } from './index';
export default function Hexagon({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="50,8 90,28 90,72 50,92 10,72 10,28" fill="#FF9800" stroke="#E65100" strokeWidth="3" />
      <polygon points="50,25 72,38 72,62 50,75 28,62 28,38" fill="#FFB74D" />
    </svg>
  );
}
