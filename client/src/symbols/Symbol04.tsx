import { SymbolProps } from './index';
export default function Mountain({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="50,15 90,85 10,85" fill="#5D8A5D" />
      <polygon points="50,15 60,35 40,35" fill="#FFFFFF" />
    </svg>
  );
}
