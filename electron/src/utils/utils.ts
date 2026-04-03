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
