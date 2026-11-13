import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDesignSystem } from '../../context/DesignSystemContext';

interface AiAssistantMascotProps {
  size?: 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  className?: string;
}

export const AiAssistantMascot: React.FC<AiAssistantMascotProps> = ({
  isThinking = false,
  className = ''
}) => {

  const { mode } = useDesignSystem();
  const [blink, setBlink] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  // Natural blinking interval
  useEffect(() => {
    let timeout: any;
    const scheduleBlink = () => {
      const delay = Math.random() * 3500 + 2500;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 160);
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Pupil motion tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xRel = (e.clientX / window.innerWidth - 0.5) * 3;
      const yRel = (e.clientY / window.innerHeight - 0.5) * 2;
      setPupilOffset({ x: Math.max(-2.5, Math.min(2.5, xRel)), y: Math.max(-1.5, Math.min(1.5, yRel)) });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // OP-1 waveform state
  const [bars, setBars] = useState<number[]>([40, 70, 30, 85, 55, 90, 45]);
  useEffect(() => {
    if (mode !== 'precision') return;
    const interval = setInterval(() => {
      setBars([
        Math.floor(20 + Math.random() * 70),
        Math.floor(30 + Math.random() * 70),
        Math.floor(15 + Math.random() * 85),
        Math.floor(40 + Math.random() * 60),
        Math.floor(25 + Math.random() * 75),
        Math.floor(35 + Math.random() * 65),
        Math.floor(20 + Math.random() * 80)
      ]);
    }, 120);
    return () => clearInterval(interval);
  }, [mode]);

  // Mode: Precision (OP-1 Monospace Oscilloscope)
  if (mode === 'precision') {
    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 bg-black border border-amber-500/40 font-mono text-[10px] text-amber-400 select-none ${className}`}
        title="TE OP-1 Engine Synthesizer Status"
      >
        <span className="w-1.5 h-1.5 rounded-none bg-amber-500 animate-pulse" />
        <span className="text-amber-500 font-bold uppercase tracking-widest text-[9px]">AI.DSP</span>
        <div className="flex items-end gap-0.5 h-3.5 w-7 px-0.5 border-l border-r border-amber-500/30">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-0.5 bg-amber-400 transition-all duration-100 ease-out"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Mode: Liquid Studio (VisionOS / Siri-like Spatial Liquid Orb)
  if (mode === 'liquid') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <motion.div
          animate={{
            scale: isThinking ? [1, 1.15, 0.95, 1.08, 1] : [1, 1.05, 0.98, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 16, repeat: Infinity, ease: 'linear' }
          }}
          className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[1.5px] shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        >
          <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-md flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{
                opacity: [0.6, 0.9, 0.6],
                scale: [0.8, 1.1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-400 blur-[1px]"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Mode: Horizon Glass (Anthropomorphic Animated AI Eyes / Mascot)
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <motion.div
        animate={{
          y: isThinking ? [-1, 1, -1] : [-0.5, 0.5, -0.5]
        }}
        transition={{
          repeat: Infinity,
          duration: isThinking ? 0.8 : 3.5,
          ease: 'easeInOut'
        }}
        className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-b from-white/90 to-amber-50/80 dark:from-white/10 dark:to-amber-500/10 backdrop-blur-md border border-amber-300/40 dark:border-amber-400/20 shadow-[0_2px_10px_rgba(245,158,11,0.12)] cursor-pointer select-none group"
        title="Omni AI Companion (Aktywny, reaguje na ruch)"
      >
        {/* Subtle horizon sunrise backlight glow */}
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400/20 via-rose-400/20 to-sky-400/20 blur-xs -z-10 group-hover:opacity-100 opacity-60 transition-opacity" />

        {/* Left Eye */}
        <div className="relative w-2.5 h-3 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center overflow-hidden transition-all duration-100"
          style={{ height: blink ? '2px' : '12px' }}
        >
          {!blink && (
            <motion.div
              className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-300 shadow-[0_0_3px_#f59e0b]"
              style={{
                transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`
              }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            />
          )}
        </div>

        {/* Right Eye */}
        <div className="relative w-2.5 h-3 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center overflow-hidden transition-all duration-100"
          style={{ height: blink ? '2px' : '12px' }}
        >
          {!blink && (
            <motion.div
              className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-300 shadow-[0_0_3px_#f59e0b]"
              style={{
                transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`
              }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            />
          )}
        </div>

        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 ml-0.5 pr-0.5 tracking-tight hidden sm:inline">
          Omni
        </span>
      </motion.div>
    </div>
  );
};
