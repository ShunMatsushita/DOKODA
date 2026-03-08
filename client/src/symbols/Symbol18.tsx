import { SymbolProps } from './index';
export default function Rabbit({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="38" cy="25" rx="8" ry="22" fill="#FFCCCC" />
      <ellipse cx="62" cy="25" rx="8" ry="22" fill="#FFCCCC" />
      <ellipse cx="38" cy="25" rx="4" ry="16" fill="#FF8A80" />
      <ellipse cx="62" cy="25" rx="4" ry="16" fill="#FF8A80" />
      <circle cx="50" cy="60" r="26" fill="#FFCCCC" />
      <circle cx="40" cy="55" r="4" fill="#333" />
      <circle cx="60" cy="55" r="4" fill="#333" />
      <ellipse cx="50" cy="65" rx="4" ry="3" fill="#FF8A80" />
      <path d="M46 68 Q50 74 54 68" fill="none" stroke="#333" strokeWidth="2" />
    </svg>
  );
}
