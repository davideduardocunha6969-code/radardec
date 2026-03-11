export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error?.message || error?.error_description || "";
    if (/jwt|expired|token/i.test(msg)) {
      await new Promise((r) => setTimeout(r, 1200));
      return await fn();
    }
    throw error;
  }
}
