import { SymbolProps } from './index';
export default function Sakura({ size = 100, className }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <ellipse key={i} cx={50 + 22 * Math.cos((angle - 90) * Math.PI / 180)} cy={50 + 22 * Math.sin((angle - 90) * Math.PI / 180)} rx="12" ry="18" fill="#F48FB1" transform={`rotate(${angle} ${50 + 22 * Math.cos((angle - 90) * Math.PI / 180)} ${50 + 22 * Math.sin((angle - 90) * Math.PI / 180)})`} />
      ))}
      <circle cx="50" cy="50" r="8" fill="#FCE4EC" />
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <circle key={i} cx={50 + 6 * Math.cos((angle - 90) * Math.PI / 180)} cy={50 + 6 * Math.sin((angle - 90) * Math.PI / 180)} r="1.5" fill="#E91E63" />
      ))}
    </svg>
  );
}
