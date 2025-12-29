import { useAppStore } from '@/store/useAppStore';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface HandleAppErrorOptions {
  title?: string;
  defaultMessage?: string;
  notify?: boolean;
  notificationType?: NotificationType;
  logLabel?: string;
  userMessagePrefix?: string;
}

function toErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  try {
    const json = JSON.stringify(error);
    if (typeof json === 'string' && json !== '{}' && json !== 'null') {
      return json;
    }
  } catch {
  }

  return defaultMessage;
}

export function handleAppError(error: unknown, options: HandleAppErrorOptions = {}): string {
  const {
    title = 'Error',
    defaultMessage = 'Something went wrong',
    notify = true,
    notificationType = 'error',
    logLabel,
    userMessagePrefix,
  } = options;

  const message = toErrorMessage(error, defaultMessage);
  const userMessage = userMessagePrefix ? `${userMessagePrefix}: ${message}` : message;

  if (logLabel) {
    console.error(logLabel, error);
  } else {
    console.error(error);
  }

  if (notify) {
    useAppStore.getState().addNotification({
      type: notificationType,
      title,
      message: userMessage,
    });
  }

  return userMessage;
}
