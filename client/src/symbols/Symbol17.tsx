import { SymbolProps } from './index';
export default function Octopus({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="50" cy="38" rx="28" ry="24" fill="#9C27B0" />
      <circle cx="40" cy="34" r="5" fill="#FFF" />
      <circle cx="60" cy="34" r="5" fill="#FFF" />
      <circle cx="41" cy="35" r="2.5" fill="#333" />
      <circle cx="61" cy="35" r="2.5" fill="#333" />
      <path d="M50 45 Q53 52 50 48" fill="none" stroke="#E91E63" strokeWidth="2" />
      {[20, 30, 40, 50, 60, 70, 80].map((x, i) => (
        <path key={i} d={`M${x} 55 Q${x + (i % 2 === 0 ? 5 : -5)} 75 ${x + (i % 2 === 0 ? -3 : 3)} 90`} fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
      ))}
    </svg>
  );
}
