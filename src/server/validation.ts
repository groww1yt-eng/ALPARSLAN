export function validateAndSanitizeUrl(inputUrl: string): string {
    try {
        const url = new URL(inputUrl);

        // Protocol check
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('Invalid protocol: must be http or https');
        }

        // Hostname check
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

        // Clean query params
        const allowedParams = ['v', 'list', 't'];
        const params = new URLSearchParams(url.search);
        const newParams = new URLSearchParams();

        allowedParams.forEach(p => {
            if (params.has(p)) newParams.set(p, params.get(p)!);
        });

        // Replace params
        url.search = newParams.toString();
        return url.toString();
    } catch (error) {
        throw new Error('Invalid YouTube URL');
    }
}
