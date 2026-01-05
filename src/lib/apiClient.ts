import { API_BASE_URL, EXPECTED_API_VERSION } from '@/config';

export interface ApiRequestOptions extends RequestInit {
    fallbacks?: string[];
}

let versionMismatchNotified = false;

export async function makeApiCall(endpoint: string, options: ApiRequestOptions = {}): Promise<Response> {
    const { fallbacks = [], ...fetchOptions } = options;
    const urls = [`${API_BASE_URL}${endpoint}`, ...fallbacks.map(f => `${API_BASE_URL}${f}`)];

    let lastError: Error | null = null;

    for (const url of urls) {
        try {
            const response = await fetch(url, fetchOptions);

            // Check version header
            const backendVersion = response.headers.get('X-API-Version');
            if (backendVersion && backendVersion !== EXPECTED_API_VERSION && !versionMismatchNotified) {
                versionMismatchNotified = true;
                console.warn(`[API] Version Mismatch! Expected: ${EXPECTED_API_VERSION}, Backend: ${backendVersion}`);
                // Trigger global mismatch event
                window.dispatchEvent(new CustomEvent('api-version-mismatch', {
                    detail: { expected: EXPECTED_API_VERSION, actual: backendVersion }
                }));
            }

            if (!response.ok && urls.length > 1) {
                console.warn(`[API] Request to ${url} failed with status ${response.status}. Trying fallback...`);
                continue;
            }

            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (urls.length > 1) {
                console.warn(`[API] Request to ${url} failed. Trying fallback...`, error);
                continue;
            }
        }
    }

    throw lastError || new Error(`Failed to fetch from ${endpoint}`);
}
