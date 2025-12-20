/**
 * Security Utilities for Business Continuity App
 * Implements input validation, sanitization, and XSS prevention
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 * Removes dangerous HTML tags and attributes
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized.trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 100;
}

/**
 * Validate Saudi phone number
 * Accepts formats: 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX
 */
export function isValidSaudiPhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  const phoneRegex = /^(\+?966|0)?5[0-9]{8}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Format Saudi phone number to international format starting with 9665
 * Input: 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX, 009665XXXXXXXX
 * Output: 9665XXXXXXXX
 */
export function formatSaudiPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // Remove + sign if present
  cleaned = cleaned.replace(/^\+/, '');
  
  // If starts with 966, keep it
  if (cleaned.startsWith('966')) {
    return cleaned;
  }
  
  // If starts with 5 (mobile number), add 966
  if (cleaned.startsWith('5') && cleaned.length === 9) {
    return '966' + cleaned;
  }
  
  // If it's just the 8 digits after 5, add 9665
  if (cleaned.length === 8 && /^[0-9]{8}$/.test(cleaned)) {
    return '9665' + cleaned;
  }
  
  // Return as-is if can't format
  return cleaned;
}

/**
 * Sanitize string input - removes special characters that could cause issues
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (!input) return '';
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters (except newlines, tabs, carriage returns)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate number input
 */
export function isValidNumber(value: any, min?: number, max?: number): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * Sanitize filename - remove path traversal attempts
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove path traversal patterns
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');
  
  // Limit length
  sanitized = sanitized.substring(0, 255);
  
  return sanitized.trim();
}

/**
 * Validate choice field value against allowed options
 */
export function isValidChoice(value: string, allowedValues: string[]): boolean {
  return allowedValues.includes(value);
}

/**
 * Sanitize object for logging - remove sensitive fields
 */
export function sanitizeForLog(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...obj };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Rate limiting helper - prevents brute force attacks
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const loginRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

/**
 * Validate file upload
 */
export function isValidFileUpload(file: File, allowedTypes: string[], maxSizeMB: number = 10): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'لم يتم تحديد ملف' };
  }
  
  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB} ميجابايت` };
  }
  
  // Check file type
  const fileType = file.type.toLowerCase();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  
  const isTypeAllowed = allowedTypes.some(type => {
    if (type.includes('*')) {
      const mainType = type.split('/')[0];
      return fileType.startsWith(mainType);
    }
    return fileType === type;
  });
  
  if (!isTypeAllowed) {
    return { valid: false, error: 'نوع الملف غير مسموح' };
  }
  
  // Check for double extensions (e.g., file.pdf.exe)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    return { valid: false, error: 'اسم الملف غير صالح' };
  }
  
  return { valid: true };
}

/**
 * Content Security Policy - recommended headers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.powerapps.com https://*.dynamics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.powerapps.com https://*.dynamics.com https://*.sharepoint.com",
    "frame-ancestors 'self' https://*.powerapps.com"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
