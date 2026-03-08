import { SymbolProps } from './index';
export default function Raindrop({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 10 C50 10 20 55 20 65 C20 82 33 95 50 95 C67 95 80 82 80 65 C80 55 50 10 50 10Z" fill="#4FC3F7" />
      <ellipse cx="40" cy="60" rx="6" ry="10" fill="#FFFFFF" opacity="0.4" />
    </svg>
  );
}
