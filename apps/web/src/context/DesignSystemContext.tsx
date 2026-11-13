import React, { createContext, useContext, useEffect, useState } from 'react';

export type DesignMode = 'horizon' | 'liquid' | 'precision';

export interface DesignModeConfig {
  id: DesignMode;
  name: string;
  tagline: string;
  badge: string;
}

export const DESIGN_MODES: DesignModeConfig[] = [
  {
    id: 'horizon',
    name: 'Horizon Glass',
    tagline: 'Warm sunrise horizon, tactile organic glass & animated mascot',
    badge: '🌅 Horizon'
  },
  {
    id: 'liquid',
    name: 'Liquid Studio',
    tagline: 'VisionOS & macOS Tahoe spatial dock, fluid curves & dynamic depth',
    badge: '💧 Liquid'
  },
  {
    id: 'precision',
    name: 'Precision OP-1',
    tagline: 'Teenage Engineering dark-tech, 4px grid & mechanical monospace',
    badge: '📟 OP-1'
  }
];

interface DesignSystemContextType {
  mode: DesignMode;
  setMode: (mode: DesignMode) => void;
  modes: DesignModeConfig[];
}

const STORAGE_KEY = 'omnidash_design_mode';

const DesignSystemContext = createContext<DesignSystemContextType | undefined>(undefined);

export const DesignSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<DesignMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'horizon' || saved === 'liquid' || saved === 'precision') {
        return saved;
      }
      return 'horizon';
    } catch {
      return 'horizon';
    }
  });

  const applyMode = (newMode: DesignMode) => {
    const root = document.documentElement;
    root.setAttribute('data-design-mode', newMode);
    
    // Remove previous mode classes
    root.classList.remove('mode-horizon', 'mode-liquid', 'mode-precision');
    root.classList.add(`mode-${newMode}`);

    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  const setMode = (newMode: DesignMode) => {
    setModeState(newMode);
    applyMode(newMode);
  };

  return (
    <DesignSystemContext.Provider value={{ mode, setMode, modes: DESIGN_MODES }}>
      {children}
    </DesignSystemContext.Provider>
  );
};

export const useDesignSystem = (): DesignSystemContextType => {
  const ctx = useContext(DesignSystemContext);
  if (!ctx) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return ctx;
};
