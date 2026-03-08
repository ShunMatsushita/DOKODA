import { SymbolProps } from './index';
export default function Cross({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <rect x="38" y="10" width="24" height="80" rx="4" fill="#F44336" />
      <rect x="10" y="38" width="80" height="24" rx="4" fill="#F44336" />
    </svg>
  );
}
