import { SymbolProps } from './index';
export default function MusicNote({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <ellipse cx="35" cy="75" rx="14" ry="10" fill="#E91E63" transform="rotate(-20 35 75)" />
      <rect x="47" y="15" width="5" height="62" fill="#E91E63" />
      <path d="M52 15 L52 35 Q70 30 80 20 L80 10 Q70 18 52 15Z" fill="#E91E63" />
    </svg>
  );
}
