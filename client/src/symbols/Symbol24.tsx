import { SymbolProps } from './index';
export default function Pizza({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 10 L15 85 A45 45 0 0 0 85 85 Z" fill="#FFC107" />
      <path d="M50 10 L15 85 A45 45 0 0 0 85 85 Z" fill="none" stroke="#E65100" strokeWidth="3" />
      <circle cx="45" cy="45" r="7" fill="#D32F2F" />
      <circle cx="60" cy="55" r="6" fill="#D32F2F" />
      <circle cx="40" cy="65" r="5" fill="#D32F2F" />
      <circle cx="55" cy="72" r="6" fill="#4CAF50" opacity="0.7" />
    </svg>
  );
}
