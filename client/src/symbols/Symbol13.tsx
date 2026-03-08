import { SymbolProps } from './index';
export default function Dog({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="25" cy="45" rx="12" ry="20" fill="#A0522D" />
      <ellipse cx="75" cy="45" rx="12" ry="20" fill="#A0522D" />
      <circle cx="50" cy="55" r="28" fill="#D2691E" />
      <circle cx="40" cy="48" r="4" fill="#333" />
      <circle cx="60" cy="48" r="4" fill="#333" />
      <ellipse cx="50" cy="60" rx="8" ry="6" fill="#333" />
      <path d="M45 68 Q50 75 55 68" fill="none" stroke="#333" strokeWidth="2" />
      <circle cx="50" cy="60" r="2" fill="#FF69B4" />
    </svg>
  );
}
