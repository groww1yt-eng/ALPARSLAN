import { useUIStore } from '@/store/useUIStore';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface HandleAppErrorOptions {
  title?: string;
  defaultMessage?: string;
  notify?: boolean;
  notificationType?: NotificationType;
  logLabel?: string;
  userMessagePrefix?: string;
}

// Parse error and return a user-friendly message based on known patterns
function getFriendlyErrorMessage(error: any, defaultMessage: string): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  // If rawMessage is the JSON stringified error, simpler message is better?
  // Actually, let's just inspect the string content.

  const lowerMessage = rawMessage.toLowerCase();

  // Network / Connection Errors
  if (
    lowerMessage.includes('network error') ||
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('connect')
  ) {
    return 'Network error: Cannot connect to the server. Please ensure the backend server is running.';
  }

  // Not Found / 404
  if (
    lowerMessage.includes('404') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('video unavailable')
  ) {
    return 'Video not found: It may have been deleted or the ID is incorrect.';
  }

  // Private / Auth / 403
  if (
    lowerMessage.includes('private') ||
    lowerMessage.includes('sign in') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('forbidden')
  ) {
    return 'Access denied: This video is private or requires a sign-in.';
  }

  // Geo-restriction
  if (
    lowerMessage.includes('region') ||
    lowerMessage.includes('country') ||
    lowerMessage.includes('geographic')
  ) {
    return 'Geo-restricted: This video is not available in your region.';
  }

  // Age restriction
  if (lowerMessage.includes('age restricted')) {
    return 'Age restricted: This video requires age verification.';
  }

  // Invalid URL (if not caught by frontend validation)
  if (lowerMessage.includes('invalid url')) {
    return 'Invalid URL: Please check the link and try again.';
  }

  // Return original if valid string, else default
  if (rawMessage && typeof rawMessage === 'string' && rawMessage !== '[object Object]') {
    return rawMessage;
  }

  return defaultMessage;
}

// Centralized error handling utility
// Logs to console and optionally shows UI notification
export function handleAppError(error: unknown, options: HandleAppErrorOptions = {}): string {
  const {
    title = 'Error',
    defaultMessage = 'Something went wrong',
    notify = true,
    notificationType = 'error',
    logLabel,
    userMessagePrefix,
  } = options;

  const message = getFriendlyErrorMessage(error, defaultMessage);
  const userMessage = userMessagePrefix ? `${userMessagePrefix}: ${message}` : message;

  if (logLabel) {
    console.error(logLabel, error);
  } else {
    console.error(error);
  }

  if (notify) {
    useUIStore.getState().addNotification({
      type: notificationType,
      title,
      message: userMessage,
    });
  }

  return userMessage;
}
