import { SymbolProps } from './index';
export default function Arrow({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="50,8 85,50 65,50 65,90 35,90 35,50 15,50" fill="#4CAF50" />
    </svg>
  );
}
