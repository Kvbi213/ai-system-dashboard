import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface RulerWheelPickerProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  unit?: string;
  label?: string;
  onChange?: (value: number) => void;
  className?: string;
  compact?: boolean;
  pureBlack?: boolean;
  accent?: 'cyan' | 'sky' | 'amber' | 'emerald';
}

// Singleton audio/haptics synth
class AudioHapticsService {
  private ctx: AudioContext | null = null;
  private lastTickTime = 0;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public triggerTick() {
    // 1. Mobile Haptics
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(5);
      }
    } catch {
      // Ignored
    }

    // 2. High frequency synthesizer click with fast decay
    const now = performance.now();
    if (now - this.lastTickTime < 16) return; // Prevent distortion on ultra-fast gestures
    this.lastTickTime = now;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.012);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.013);
    } catch {
      // Blocked until first interaction
    }
  }
}

const feedback = new AudioHapticsService();

const ACCENT_STYLES = {
  cyan: {
    badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    number: 'text-cyan-400',
    numberFast: 'text-cyan-300',
    needleHead: 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)]',
    needleLine: 'from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.9)]',
    tickTen: 'h-7 bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
  },
  sky: {
    badge: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    number: 'text-sky-400',
    numberFast: 'text-sky-300',
    needleHead: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,1)]',
    needleLine: 'from-sky-400 via-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(56,189,248,0.9)]',
    tickTen: 'h-7 bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
  },
  emerald: {
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    number: 'text-emerald-400',
    numberFast: 'text-emerald-300',
    needleHead: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,1)]',
    needleLine: 'from-emerald-400 via-teal-400 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]',
    tickTen: 'h-7 bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
  },
  amber: {
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    number: 'text-amber-400',
    numberFast: 'text-amber-300',
    needleHead: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]',
    needleLine: 'from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,1)]',
    tickTen: 'h-7 bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
  }
};

export const RulerWheelPicker: React.FC<RulerWheelPickerProps> = ({
  min = 10,
  max = 300,
  step = 1,
  defaultValue = 60,
  value: controlledValue,
  unit = 'sekundy',
  label = 'Czas przerwy',
  onChange,
  className = '',
  compact = false,
  pureBlack = false,
  accent = 'cyan'
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<number>(defaultValue);
  const currentValue = isControlled ? controlledValue : internalValue;

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startValRef = useRef<number>(currentValue);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastEmittedValueRef = useRef<number>(currentValue);
  const [isFastMoving, setIsFastMoving] = useState(false);

  const colors = ACCENT_STYLES[accent] || ACCENT_STYLES.cyan;

  const tickSpacing = compact ? 12 : 14; // pixels per unit
  const visibleRadius = 24; // visible units left and right of center

  // Synchronize internal tracking with external controlled updates
  useEffect(() => {
    if (isControlled && !isDraggingRef.current) {
      lastEmittedValueRef.current = controlledValue;
      startValRef.current = controlledValue;
    }
  }, [controlledValue, isControlled]);

  const clampValue = useCallback((val: number) => {
    return Math.max(min, Math.min(max, Math.round(val / step) * step));
  }, [min, max, step]);

  const updateValue = useCallback((newVal: number, triggerAudio = true) => {
    const clamped = clampValue(newVal);
    if (clamped !== lastEmittedValueRef.current) {
      if (triggerAudio) {
        feedback.triggerTick();
      }
      lastEmittedValueRef.current = clamped;
      if (!isControlled) {
        setInternalValue(clamped);
      }
      onChange?.(clamped);
    }
  }, [clampValue, isControlled, onChange]);

  // Inertia momentum animation loop
  const startMomentum = useCallback(() => {
    let vel = velocityRef.current;
    let curr = currentValue;

    const stepMomentum = () => {
      if (Math.abs(vel) > 0.02) {
        vel *= 0.92; // Friction
        curr = Math.max(min - 2, Math.min(max + 2, curr - vel * 0.7));
        updateValue(curr, true);
        animationFrameRef.current = requestAnimationFrame(stepMomentum);
      } else {
        // Snap to nearest integer
        const snapped = clampValue(curr);
        updateValue(snapped, true);
        setIsFastMoving(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    if (Math.abs(vel) > 0.1) {
      setIsFastMoving(true);
      animationFrameRef.current = requestAnimationFrame(stepMomentum);
    } else {
      updateValue(clampValue(curr), true);
      setIsFastMoving(false);
    }
  }, [clampValue, currentValue, max, min, updateValue]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startValRef.current = currentValue;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = e.clientX - startXRef.current;
    
    // Instantaneous velocity in value units per frame
    const deltaUnits = -dx / tickSpacing;
    const speed = (e.movementX / dt) * 16.6;
    velocityRef.current = (speed / tickSpacing) * 2.5;
    lastTimeRef.current = now;

    if (Math.abs(velocityRef.current) > 0.8) {
      setIsFastMoving(true);
    } else {
      setIsFastMoving(false);
    }

    const calculatedVal = startValRef.current + deltaUnits;
    updateValue(calculatedVal, true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    startMomentum();
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let delta = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      delta = step;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      delta = -step;
    } else if (e.key === 'PageUp') {
      delta = step * 10;
    } else if (e.key === 'PageDown') {
      delta = -step * 10;
    } else if (e.key === 'Home') {
      updateValue(min, true);
      e.preventDefault();
      return;
    } else if (e.key === 'End') {
      updateValue(max, true);
      e.preventDefault();
      return;
    }

    if (delta !== 0) {
      e.preventDefault();
      updateValue(currentValue + delta, true);
    }
  };

  // Wheel scrubbing
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = (e.deltaY > 0 ? 1 : -1) * step;
    updateValue(currentValue + delta, true);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Compute ticks
  const startTick = Math.max(min, Math.floor(currentValue - visibleRadius));
  const endTick = Math.min(max, Math.ceil(currentValue + visibleRadius));
  const ticks: number[] = [];
  for (let i = startTick; i <= endTick; i += step) {
    ticks.push(i);
  }

  const baseContainerStyle = pureBlack
    ? 'bg-black text-white border border-neutral-900 shadow-[0_0_30px_rgba(0,0,0,1)]'
    : 'bg-slate-900/90 text-white border border-slate-800 shadow-xl';

  return (
    <div
      className={`relative select-none rounded-2xl p-4 sm:p-5 transition-colors ${
        className || baseContainerStyle
      }`}
      tabIndex={0}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={currentValue}
      aria-valuetext={`${currentValue} ${unit}`}
      onKeyDown={handleKeyDown}
    >
      {/* Top Header: Label */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${pureBlack ? 'text-neutral-400' : 'text-slate-400'}`}>
          {label}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${colors.badge}`}>
          SNAP &amp; PHYSICS
        </span>
      </div>

      {/* Numerical Display with motion blur / mechanical slot counter transition */}
      <div className="flex flex-col items-center justify-center my-1">
        <div
          className={`text-5xl sm:text-6xl font-black font-mono tracking-tight tabular-nums transition-transform duration-75 ${
            isFastMoving ? `blur-[0.8px] scale-105 ${colors.numberFast}` : colors.number
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {currentValue}
        </div>
        <div className={`text-xs font-semibold mt-0.5 tracking-wider uppercase ${pureBlack ? 'text-neutral-400' : 'text-slate-400'}`}>
          {unit}
        </div>
      </div>

      {/* 3D Cylindrical Wheel Track Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="relative h-24 w-full cursor-ew-resize touch-pan-y overflow-hidden mt-3"
        style={{
          perspective: '1000px',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
        }}
      >
        {/* Central Indicator Marker with dynamic needle glow */}
        <div className="absolute left-1/2 top-0 bottom-3 w-1 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
          <div className={`w-2.5 h-1.5 rounded-b-sm ${colors.needleHead}`} />
          <div className={`w-0.5 h-full bg-gradient-to-b ${colors.needleLine}`} />
        </div>

        {/* Dynamic Ruler Ticks projected in 3D cylindrical space */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {ticks.map((tickVal) => {
            const distUnits = tickVal - currentValue;
            const distPx = distUnits * tickSpacing;
            const cylinderRadius = 220; // 3D bend radius
            const angleRad = distPx / cylinderRadius;

            // Clamping visibility on outer angles
            if (Math.abs(angleRad) > Math.PI / 2.2) return null;

            const scale = Math.max(0.65, Math.cos(angleRad));
            const opacity = Math.max(0.12, Math.cos(angleRad) ** 2.2);
            const rotateY = (angleRad * 180) / Math.PI;

            const isTens = tickVal % 10 === 0;
            const isFives = tickVal % 5 === 0 && !isTens;

            return (
              <div
                key={tickVal}
                className="absolute flex flex-col items-center pointer-events-none"
                style={{
                  transform: `translateX(${distPx}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  transformOrigin: 'center center -50px',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.08s ease-out'
                }}
              >
                {/* Tick bar */}
                <div
                  className={`w-0.5 rounded-full transition-colors ${
                    isTens
                      ? colors.tickTen
                      : isFives
                      ? pureBlack ? 'h-4 bg-neutral-300' : 'h-4 bg-slate-300'
                      : pureBlack ? 'h-2.5 bg-neutral-700' : 'h-2.5 bg-slate-600'
                  }`}
                />

                {/* Number label for tens */}
                {isTens && (
                  <span className={`text-[10px] font-mono font-bold mt-1.5 tabular-nums ${pureBlack ? 'text-neutral-300' : 'text-slate-300'}`}>
                    {tickVal}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle bottom helper info */}
      <div className={`flex items-center justify-between text-[10px] font-mono mt-1 px-1 ${pureBlack ? 'text-neutral-500' : 'text-slate-500'}`}>
        <span>Min: {min}s</span>
        <span className={pureBlack ? 'text-neutral-400' : 'text-slate-400'}>Przeciągnij lub użyj strzałek</span>
        <span>Max: {max}s</span>
      </div>
    </div>
  );
};
