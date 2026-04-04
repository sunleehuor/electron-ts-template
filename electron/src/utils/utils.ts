import log from 'electron-log';

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isFullUrl(str: string) {
  try {
    new URL(str); // if it parses, it's a full URL
    return true;
  } catch {
    return false; // throws if it's not a valid full URL
  }
}

export function compareVersion(v1: string, v2: string) {
  try {
    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);

    const len = Math.max(a.length, b.length);

    for (let i = 0; i < len; i++) {
      const num1 = a[i] || 0;
      const num2 = b[i] || 0;

      if (num1 > num2) return 1; // v1 is higher
      if (num1 < num2) return -1; // v1 is lower
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Retries a function up to the specified number of times with exponential backoff.
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @returns Promise resolving to the function result
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 5): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        log.warn(`Attempt ${attempt} failed, retrying...`, error.message);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}
