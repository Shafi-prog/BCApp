/**
 * Production-safe logging utility
 * Only logs in development, suppresses logs in production
 */

const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const Logger = {
  /**
   * Development only - verbose logging
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Informational messages - shown in development only
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Warning messages - shown in both dev and prod
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error messages - always shown
   * Automatically sanitizes sensitive data
   */
  error: (...args: any[]) => {
    // Sanitize error objects before logging
    const sanitizedArgs = args.map(arg => {
      if (arg && typeof arg === 'object') {
        const sanitized = { ...arg };
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization', 'sessionId'];
        
        for (const key of Object.keys(sanitized)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '***';
          }
        }
        return sanitized;
      }
      return arg;
    });

    console.error('[ERROR]', ...sanitizedArgs);
  },

  /**
   * Security-related logging - always shown
   */
  security: (message: string, details?: any) => {
    console.warn('[SECURITY]', message, details || '');
  }
};

export default Logger;
