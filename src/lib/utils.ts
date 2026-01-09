import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names safely using clsx and tailwind-merge.
 * This is the standard utility for conditional tailwind classes.
 * 
 * @param inputs - Class values to merge
 * @returns The merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Allowed hostnames for YouTube
const ALLOWED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com'
];

// Validate and sanitize URL (Frontend version)
export function validateAndSanitizeUrl(inputUrl: string): string {
  try {
    const url = new URL(inputUrl);

    // Protocol check
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid protocol: must be http or https');
    }

    // Hostname check
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

    // Convert to string (remove trailing slash if it was just domain, though usually youtube urls have path)
    return url.toString();
  } catch (error) {
    throw new Error('Invalid YouTube URL');
  }
}

// Boolean validation helper
export function isValidYouTubeUrl(url: string): boolean {
  try {
    validateAndSanitizeUrl(url);
    return true;
  } catch {
    return false;
  }
}
