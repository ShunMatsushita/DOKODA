import { SymbolProps } from './index';
export default function Daruma({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="50" cy="55" rx="35" ry="38" fill="#D32F2F" />
      <ellipse cx="50" cy="48" rx="26" ry="22" fill="#FAFAFA" />
      <circle cx="38" cy="48" r="10" fill="#FFF" stroke="#333" strokeWidth="2" />
      <circle cx="62" cy="48" r="10" fill="#FFF" stroke="#333" strokeWidth="2" />
      <circle cx="38" cy="48" r="5" fill="#333" />
      <ellipse cx="50" cy="58" rx="5" ry="3" fill="#D32F2F" />
      <path d="M42 65 Q50 72 58 65" fill="none" stroke="#333" strokeWidth="2" />
      <path d="M22 35 Q50 22 78 35" fill="none" stroke="#FFD700" strokeWidth="3" />
    </svg>
  );
}
