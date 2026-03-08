import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'ocean' | 'sakura';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'ダーク' },
  { id: 'light', label: 'ライト' },
  { id: 'ocean', label: 'オーシャン' },
  { id: 'sakura', label: 'サクラ' },
];

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('dokoda-theme');
  if (stored && THEMES.some((t) => t.id === stored)) return stored as Theme;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dokoda-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.id === theme);
    setTheme(THEMES[(idx + 1) % THEMES.length].id);
  };

  return { theme, setTheme, cycleTheme, themes: THEMES };
}
