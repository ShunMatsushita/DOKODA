import { SymbolProps } from './index';
export default function Onigiri({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 12 L85 75 Q85 88 72 88 L28 88 Q15 88 15 75 Z" fill="#FAFAFA" />
      <path d="M50 12 L85 75 Q85 88 72 88 L28 88 Q15 88 15 75 Z" fill="none" stroke="#E0E0E0" strokeWidth="2" />
      <rect x="25" y="60" width="50" height="28" rx="4" fill="#1B5E20" />
    </svg>
  );
}
