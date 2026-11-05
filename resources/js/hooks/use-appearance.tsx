// resources/js/hooks/use-appearance.ts

// Runtime is locked to light mode (dark mode disabled), but the Appearance
// union stays wide so theme consumers can reference all standard values.
export type Appearance = 'light' | 'dark' | 'system';

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
        appearance: 'light' as Appearance,
        // Disable theme switching (parameter accepted for API compatibility)
        updateAppearance: (_appearance: Appearance) => {
            // Do nothing — light mode is permanent
        },
    } as const;
}
