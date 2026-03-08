import { SymbolProps } from './index';
export default function Clock({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="38" fill="#FAFAFA" stroke="#3F51B5" strokeWidth="5" />
      <circle cx="50" cy="50" r="3" fill="#3F51B5" />
      <line x1="50" y1="50" x2="50" y2="22" stroke="#3F51B5" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="50" x2="70" y2="50" stroke="#3F51B5" strokeWidth="3" strokeLinecap="round" />
      {[12, 3, 6, 9].map((n, i) => (
        <circle key={i} cx={50 + 32 * Math.sin(i * Math.PI / 2)} cy={50 - 32 * Math.cos(i * Math.PI / 2)} r="3" fill="#3F51B5" />
      ))}
    </svg>
  );
}
