import { SymbolProps } from './index';
export default function Sun({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="20" fill="#FFD700" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line key={i} x1="50" y1="50" x2={50 + 35 * Math.cos(angle * Math.PI / 180)} y2={50 + 35 * Math.sin(angle * Math.PI / 180)} stroke="#FFD700" strokeWidth="4" strokeLinecap="round" />
      ))}
    </svg>
  );
}
