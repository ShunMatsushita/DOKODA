import { SymbolProps } from './index';
export default function Diamond({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="50,8 90,38 50,92 10,38" fill="#00BCD4" />
      <polygon points="50,8 90,38 50,38" fill="#4DD0E1" />
      <polygon points="50,8 10,38 50,38" fill="#26C6DA" />
      <polygon points="50,38 90,38 50,92" fill="#0097A7" />
      <polygon points="50,38 10,38 50,92" fill="#00ACC1" />
    </svg>
  );
}
