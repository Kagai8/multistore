// resources/js/hooks/use-appearance.ts

// Force light mode only — disable dark mode completely
export type Appearance = 'light';

export function initializeTheme() {
  if (typeof document !== 'undefined') {
    // Ensure dark mode class is NEVER applied
    document.documentElement.classList.remove('dark');
    // Force light color scheme
    document.documentElement.style.colorScheme = 'light';
  }
}

export function useAppearance() {
  // Always return light mode
  return {
    appearance: 'light' as const,
    // Disable theme switching
    updateAppearance: () => {
      // Do nothing — light mode is permanent
    },
  } as const;
}
