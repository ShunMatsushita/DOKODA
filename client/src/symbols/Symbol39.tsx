import { SymbolProps } from './index';
export default function Rocket({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 5 C40 20 35 50 35 70 L65 70 C65 50 60 20 50 5Z" fill="#B0BEC5" />
      <path d="M50 5 C45 15 42 30 42 40 L58 40 C58 30 55 15 50 5Z" fill="#ECEFF1" />
      <circle cx="50" cy="45" r="8" fill="#1E88E5" />
      <path d="M35 55 L20 72 L35 68" fill="#E53935" />
      <path d="M65 55 L80 72 L65 68" fill="#E53935" />
      <path d="M38 70 L42 90 L50 82 L58 90 L62 70" fill="#FF9800" />
      <path d="M42 70 L46 84 L50 78 L54 84 L58 70" fill="#FFEB3B" />
    </svg>
  );
}
