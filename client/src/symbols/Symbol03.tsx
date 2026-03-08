import { SymbolProps } from './index';
export default function Cloud({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="35" cy="55" r="20" fill="#87CEEB" />
      <circle cx="55" cy="45" r="25" fill="#87CEEB" />
      <circle cx="70" cy="55" r="18" fill="#87CEEB" />
      <rect x="20" y="55" width="65" height="18" rx="9" fill="#87CEEB" />
    </svg>
  );
}
