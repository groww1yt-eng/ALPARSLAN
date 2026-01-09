// Validate and sanitize user-provided YouTube URLs
export function validateAndSanitizeUrl(inputUrl: string): string {
    try {
        const url = new URL(inputUrl);

        // Protocol check (security)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('Invalid protocol: must be http or https');
        }

        // Hostname check (whitelist)
        const ALLOWED_HOSTS = [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'youtu.be',
            'www.youtu.be',
            'youtube-nocookie.com'
        ];

        if (!ALLOWED_HOSTS.includes(url.hostname)) {
            throw new Error('Invalid hostname: must be a YouTube domain');
        }

        // Clean query params to remove tracking parameters
        const allowedParams = ['v', 'list', 't'];
        const params = new URLSearchParams(url.search);
        const newParams = new URLSearchParams();

        allowedParams.forEach(p => {
            if (params.has(p)) newParams.set(p, params.get(p)!);
        });

        // Replace params with cleaned version
        url.search = newParams.toString();
        return url.toString();
    } catch (error) {
        throw new Error('Invalid YouTube URL');
    }
}
