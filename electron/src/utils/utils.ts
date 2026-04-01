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
