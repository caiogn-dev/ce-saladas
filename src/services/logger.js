/**
 * Logger Service - Centralized logging with environment awareness
 * 
 * In development: logs to console with full details
 * In production: logs errors to external service (Sentry-ready)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Current log level based on environment
const currentLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

/**
 * Format log message with timestamp and context
 */
function formatMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 
    ? ` | ${JSON.stringify(context)}` 
    : '';
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
}

/**
 * Send error to external monitoring service (Sentry-ready)
 */
function sendToMonitoring(error, context = {}) {
  // Sentry integration placeholder
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
  
  // For now, store in sessionStorage for debugging
  if (typeof window !== 'undefined' && !isTest) {
    try {
      const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
      errors.push({
        timestamp: new Date().toISOString(),
        message: error.message || String(error),
        stack: error.stack,
        context,
      });
      // Keep only last 50 errors
      if (errors.length > 50) errors.shift();
      sessionStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Storage might be full or unavailable
    }
  }
}

/**
 * Debug level logging - only in development
 */
export function debug(message, context = {}) {
  if (currentLevel <= LOG_LEVELS.DEBUG && isDevelopment) {
    console.debug(formatMessage('DEBUG', message, context));
  }
}

/**
 * Info level logging - development only
 */
export function info(message, context = {}) {
  if (currentLevel <= LOG_LEVELS.INFO && isDevelopment) {
    console.info(formatMessage('INFO', message, context));
  }
}

/**
 * Warning level logging - always logged in development
 */
export function warn(message, context = {}) {
  if (currentLevel <= LOG_LEVELS.WARN) {
    if (isDevelopment) {
      console.warn(formatMessage('WARN', message, context));
    }
    // In production, warnings are silently tracked
    sendToMonitoring(new Error(message), { level: 'warn', ...context });
  }
}

/**
 * Error level logging - always logged, sent to monitoring in production
 */
export function error(message, errorObj = null, context = {}) {
  const err = errorObj instanceof Error ? errorObj : new Error(message);
  
  if (isDevelopment) {
    console.error(formatMessage('ERROR', message, context));
    if (errorObj && errorObj !== message) {
      console.error(errorObj);
    }
  }
  
  // Always send errors to monitoring
  sendToMonitoring(err, { message, ...context });
}

/**
 * Log API errors with request context
 */
export function apiError(endpoint, err, requestData = {}) {
  const context = {
    endpoint,
    status: err?.status || err?.response?.status,
    requestData: isDevelopment ? requestData : '[redacted]',
  };
  
  error(`API Error: ${endpoint}`, err, context);
}

/**
 * Log WebSocket events
 */
export function wsEvent(event, data = {}) {
  if (isDevelopment) {
    debug(`WebSocket: ${event}`, data);
  }
}

/**
 * Log map-related events
 */
export function mapEvent(event, data = {}) {
  if (isDevelopment) {
    debug(`Map: ${event}`, data);
  }
}

/**
 * Get stored errors for debugging
 */
export function getStoredErrors() {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(sessionStorage.getItem('app_errors') || '[]');
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Clear stored errors
 */
export function clearStoredErrors() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('app_errors');
  }
}

// Default export with all methods
const logger = {
  debug,
  info,
  warn,
  error,
  apiError,
  wsEvent,
  mapEvent,
  getStoredErrors,
  clearStoredErrors,
};

export default logger;
