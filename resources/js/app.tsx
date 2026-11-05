import { route } from 'ziggy-js';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = 'Multi Store Inventory';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        // ✅ Inject Ziggy route data from Inertia shared props
        if (props.initialPage.props.ziggy) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).Ziggy = props.initialPage.props.ziggy;
        }
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

window.route = route;
