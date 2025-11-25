
import React from 'react';
import { Particle } from '../types';

interface ParticlesProps {
  particles: Particle[];
  width: number;
  height: number;
}

export const Particles: React.FC<ParticlesProps> = ({ particles, width, height }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden rounded-[10px]">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute w-1.5 h-1.5 rounded-full animate-particle-fade ${p.color}`}
          style={{
            // Position center of the cell
            left: `calc((${p.x + 0.5} / ${width}) * 100%)`,
            top: `calc((${p.y + 0.5} / ${height}) * 100%)`,
            // CSS variables for the keyframe animation
            '--tx': `${p.dx}px`,
            '--ty': `${p.dy}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
