import { SymbolProps } from './index';
export default function Heart({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 88 C20 65 5 45 5 30 C5 15 18 8 30 8 C38 8 46 13 50 20 C54 13 62 8 70 8 C82 8 95 15 95 30 C95 45 80 65 50 88Z" fill="#E91E63" />
      <ellipse cx="30" cy="30" rx="10" ry="8" fill="#FF8A80" opacity="0.5" />
    </svg>
  );
}
