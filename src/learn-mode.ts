// Compile-time only: production builds cannot be unlocked via URL or storage.
// This controls lesson browsing, never authentication or backend permissions.
export const LEARN_DEV_MODE = import.meta.env.DEV;