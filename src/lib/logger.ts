// A simple logger that wraps the console.
// This is to avoid adding a new dependency for now.
export const logger = {
  info: (...args: any[]) => {
    console.log(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};

// Converts an Error object into a plain object that can be JSON.stringified.
export function serializeError(error: any) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  // Handle cases where the error is not an Error instance
  if (typeof error === 'object' && error !== null) {
    return {
      message: 'An non-error object was thrown',
      error: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
    }
  }
  return {
    message: String(error),
  };
}
