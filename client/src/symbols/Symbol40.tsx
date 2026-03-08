import { SymbolProps } from './index';
export default function Spiral({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 50 C50 44 56 38 62 38 C72 38 78 46 78 55 C78 68 66 78 53 78 C36 78 25 65 25 50 C25 32 38 20 55 20 C75 20 88 35 88 55" fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
