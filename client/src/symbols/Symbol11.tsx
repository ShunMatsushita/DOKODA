import { SymbolProps } from './index';
export default function Snowflake({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {[0, 60, 120].map((angle, i) => (
        <g key={i}>
          <line x1={50 + 35 * Math.cos(angle * Math.PI / 180)} y1={50 + 35 * Math.sin(angle * Math.PI / 180)} x2={50 - 35 * Math.cos(angle * Math.PI / 180)} y2={50 - 35 * Math.sin(angle * Math.PI / 180)} stroke="#00BCD4" strokeWidth="5" strokeLinecap="round" />
          <line x1={50 + 20 * Math.cos(angle * Math.PI / 180)} y1={50 + 20 * Math.sin(angle * Math.PI / 180)} x2={50 + 20 * Math.cos(angle * Math.PI / 180) + 12 * Math.cos((angle + 60) * Math.PI / 180)} y2={50 + 20 * Math.sin(angle * Math.PI / 180) + 12 * Math.sin((angle + 60) * Math.PI / 180)} stroke="#00BCD4" strokeWidth="3" strokeLinecap="round" />
          <line x1={50 + 20 * Math.cos(angle * Math.PI / 180)} y1={50 + 20 * Math.sin(angle * Math.PI / 180)} x2={50 + 20 * Math.cos(angle * Math.PI / 180) + 12 * Math.cos((angle - 60) * Math.PI / 180)} y2={50 + 20 * Math.sin(angle * Math.PI / 180) + 12 * Math.sin((angle - 60) * Math.PI / 180)} stroke="#00BCD4" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
