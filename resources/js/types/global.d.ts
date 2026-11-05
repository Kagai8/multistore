// Global type augmentations for the frontend.

interface AppConfig {
    APP_NAME: string;
    APP_URL: string;
    // Add other properties as needed, like:
    user: {
        id: number;
        name: string;
        email: string;
        store_id: number | null; // The user's assigned store
        isGlobalUser: boolean; // If the user can see all stores
        permissions: string[];
    };
    [key: string]: unknown; // Allows for flexibility with other keys
}

declare global {
    // 🟢 This uses interface merging to add APP_CONFIG to the global Window object
    interface Window {
        APP_CONFIG: AppConfig;
        // app.tsx exposes Ziggy's route() helper on window so scripts can build URLs
        route: typeof import('ziggy-js').route;
    }
}

export {};
