interface AppConfig {
    APP_NAME: string;
    APP_URL: string;
    // Add other properties as needed, like:
    user: {
        id: number;
        name: string;
        email: string;
        store_id: number | null; // The user's assigned store
        isGlobalUser: boolean;    // If the user can see all stores
        permissions: string[];
    };
    [key: string]: any; // Allows for flexibility with other keys
}

// 🟢 FIX: This uses interface merging to add APP_CONFIG to the global Window object
interface Window {
    APP_CONFIG: AppConfig;
}
