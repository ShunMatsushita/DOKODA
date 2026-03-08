import { SymbolProps } from './index';
export default function Bird({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="50" cy="55" rx="25" ry="20" fill="#E53935" />
      <circle cx="50" cy="38" r="15" fill="#E53935" />
      <circle cx="55" cy="35" r="3" fill="#333" />
      <polygon points="65,38 80,35 65,42" fill="#FFA000" />
      <path d="M25,55 L10,40 L20,55" fill="#E53935" />
      <polygon points="45,72 50,88 55,72" fill="#FFA000" />
      <polygon points="55,72 60,88 65,72" fill="#FFA000" />
    </svg>
  );
}
