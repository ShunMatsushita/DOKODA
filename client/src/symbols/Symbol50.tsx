import { SymbolProps } from './index';
export default function ManekiNeko({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="25,30 32,8 42,28" fill="#FAFAFA" />
      <polygon points="58,28 68,8 75,30" fill="#FAFAFA" />
      <ellipse cx="50" cy="58" rx="28" ry="32" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="1" />
      <circle cx="40" cy="48" r="4" fill="#333" />
      <circle cx="60" cy="48" r="4" fill="#333" />
      <ellipse cx="50" cy="55" rx="3" ry="2" fill="#FF8A80" />
      <circle cx="38" cy="55" r="6" fill="#FFCDD2" opacity="0.6" />
      <circle cx="62" cy="55" r="6" fill="#FFCDD2" opacity="0.6" />
      <path d="M78 28 Q88 15 82 42 Q80 48 78 42" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="1" />
      <circle cx="50" cy="72" r="8" fill="#FFD700" stroke="#FFA000" strokeWidth="2" />
    </svg>
  );
}
