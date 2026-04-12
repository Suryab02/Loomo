import { toast } from 'sonner'

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const maybeError = error as {
      data?: { detail?: string; error?: string };
      message?: string;
      error?: string;
      status?: number;
    };

    if (typeof maybeError.data?.detail === 'string') return maybeError.data.detail;
    if (typeof maybeError.data?.error === 'string') return maybeError.data.error;
    if (typeof maybeError.error === 'string') return maybeError.error;
    if (typeof maybeError.message === 'string') return maybeError.message;
    if (maybeError.status === 429) return 'Too many AI requests. Try again in a few minutes.';
  }

  return fallback;
}

export function notifyError(error: unknown, fallback?: string) {
  const msg = getErrorMessage(error, fallback);
  toast.error(msg);
}

export function notifySuccess(message: string) {
  toast.success(message);
}
