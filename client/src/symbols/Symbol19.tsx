import { SymbolProps } from './index';
export default function Turtle({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="50" cy="55" rx="32" ry="22" fill="#4CAF50" />
      <ellipse cx="50" cy="55" rx="25" ry="16" fill="#66BB6A" />
      <line x1="50" y1="39" x2="50" y2="71" stroke="#4CAF50" strokeWidth="2" />
      <line x1="25" y1="55" x2="75" y2="55" stroke="#4CAF50" strokeWidth="2" />
      <circle cx="25" cy="38" r="8" fill="#81C784" />
      <circle cx="25" cy="72" r="6" fill="#81C784" />
      <circle cx="75" cy="72" r="6" fill="#81C784" />
      <circle cx="75" cy="38" r="6" fill="#81C784" />
      <circle cx="22" cy="32" r="6" fill="#66BB6A" />
      <circle cx="20" cy="30" r="2" fill="#333" />
    </svg>
  );
}
