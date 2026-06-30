'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

/** Lightweight animated Europe dot-map visualization (no heavy globe lib). */
export function EuropeVisualization(): React.JSX.Element {
  const points = useMemo(() => {
    // Pseudo-random but stable grid of dots forming a rough Europe silhouette.
    const seed: Array<[number, number]> = [];
    let s = 7;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < 140; i++) {
      const x = rand() * 100;
      const y = rand() * 100;
      // Bias toward a Europe-ish blob centered at (52, 45)
      const dx = (x - 52) / 40;
      const dy = (y - 45) / 35;
      if (dx * dx + dy * dy < 1) seed.push([x, y]);
    }
    return seed;
  }, []);

  return (
    <div className="relative aspect-square w-full">
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.05) 60%, transparent 70%)',
        }}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        {points.map(([x, y], i) => {
          const delay = (i % 20) * 0.08;
          const isAccent = i % 7 === 0;
          return (
            <motion.circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={0.7}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0.3, 1, 0.3], scale: 1 }}
              transition={{
                duration: 3,
                delay,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              fill={isAccent ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
            />
          );
        })}
      </svg>
      <motion.div
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0.2, 0.8] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="block h-full w-full rounded-full bg-primary ring-4 ring-primary/20" />
      </motion.div>
    </div>
  );
}
