import { SymbolProps } from './index';
export default function OrigamiCrane({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <polygon points="50,20 80,55 50,48 20,55" fill="#FF5722" />
      <polygon points="50,48 80,55 65,75 50,55" fill="#E64A19" />
      <polygon points="50,48 20,55 35,75 50,55" fill="#BF360C" />
      <polygon points="5,40 20,55 15,50" fill="#FF8A65" />
      <polygon points="80,55 95,45 85,52" fill="#FF8A65" />
      <polygon points="50,55 65,75 50,90 35,75" fill="#D84315" />
    </svg>
  );
}
