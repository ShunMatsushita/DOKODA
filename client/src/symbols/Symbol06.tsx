import { SymbolProps } from './index';
export default function Flower({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <circle key={i} cx={50 + 18 * Math.cos(angle * Math.PI / 180)} cy={50 + 18 * Math.sin(angle * Math.PI / 180)} r="14" fill="#FF69B4" opacity="0.85" />
      ))}
      <circle cx="50" cy="50" r="10" fill="#FFD700" />
    </svg>
  );
}
