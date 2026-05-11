import { useRef, useEffect } from 'react';
import type { UIEvent } from 'react';

interface ScrollPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  step?: number;
}

export default function ScrollPicker({ min, max, value, onChange, unit, step = 1 }: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 64; // px
  
  const items: number[] = [];
  for (let i = min; i <= max; i += step) {
    // Handle floating point precision issues for weight steps (e.g. 0.5)
    items.push(Math.round(i * 10) / 10);
  }

  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (items[index] !== undefined && items[index] !== value) {
      onChange(items[index]);
    }
  };

  return (
    <div className="relative h-[192px] w-full max-w-[200px] mx-auto overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}>
      {/* Center highlight overlay */}
      <div className="absolute top-1/2 left-0 right-0 h-[64px] -translate-y-1/2 border-y border-accent-500/30 bg-accent-500/10 pointer-events-none rounded-xl" />
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div style={{ height: 64 }} className="snap-center" /> {/* Top Spacer */}
        {items.map((item) => (
          <div 
            key={item}
            className="h-[64px] snap-center flex items-center justify-center transition-all duration-200"
            style={{
              opacity: item === value ? 1 : 0.3,
              transform: item === value ? 'scale(1.1)' : 'scale(0.9)',
              fontWeight: item === value ? 'bold' : 'normal',
            }}
          >
            <span className="text-4xl text-white">{item}</span>
            {item === value && unit && <span className="text-sm ml-2 text-accent-400 font-bold">{unit}</span>}
          </div>
        ))}
        <div style={{ height: 64 }} className="snap-center" /> {/* Bottom Spacer */}
      </div>
    </div>
  );
}
