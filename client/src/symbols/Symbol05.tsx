import { SymbolProps } from './index';
export default function Tree({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <rect x="43" y="60" width="14" height="30" rx="2" fill="#8B4513" />
      <polygon points="50,10 80,45 65,45 85,65 15,65 35,45 20,45" fill="#228B22" />
    </svg>
  );
}
