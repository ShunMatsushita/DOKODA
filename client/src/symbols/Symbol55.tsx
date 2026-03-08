import { SymbolProps } from './index';
export default function Chopsticks({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <line x1="35" y1="8" x2="55" y2="92" stroke="#8D6E63" strokeWidth="5" strokeLinecap="round" />
      <line x1="65" y1="8" x2="45" y2="92" stroke="#795548" strokeWidth="5" strokeLinecap="round" />
      <line x1="35" y1="8" x2="55" y2="92" stroke="#A1887F" strokeWidth="3" strokeLinecap="round" strokeDasharray="0 0" />
      <rect x="32" y="8" width="8" height="20" rx="2" fill="#D32F2F" />
      <rect x="60" y="8" width="8" height="20" rx="2" fill="#D32F2F" />
    </svg>
  );
}
