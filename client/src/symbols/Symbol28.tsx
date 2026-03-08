import { SymbolProps } from './index';
export default function Sushi({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="50" cy="65" rx="38" ry="18" fill="#FAFAFA" />
      <ellipse cx="50" cy="60" rx="38" ry="18" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="1.5" />
      <ellipse cx="50" cy="52" rx="32" ry="14" fill="#FF6F00" />
      <line x1="30" y1="50" x2="35" y2="55" stroke="#E65100" strokeWidth="1.5" />
      <line x1="45" y1="48" x2="48" y2="54" stroke="#E65100" strokeWidth="1.5" />
      <line x1="60" y1="48" x2="58" y2="54" stroke="#E65100" strokeWidth="1.5" />
    </svg>
  );
}
