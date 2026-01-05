
// Export API_BASE_URL derived from environment variables
// In development, this will likely be http://localhost:3001 if set in .env
// In production, this will be the value set in .env.production or the build environment

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const EXPECTED_API_VERSION = '1.0.0';

