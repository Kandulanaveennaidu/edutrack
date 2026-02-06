import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        // Production: JSON logs for log aggregation services
        formatters: {
          level: (label: string) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

/**
 * Create a child logger with context (e.g., route name, request ID)
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log an API request with standard fields
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  schoolId?: string,
  extra?: Record<string, unknown>,
) {
  logger.info({
    type: "api_request",
    method,
    path,
    userId,
    schoolId,
    ...extra,
  });
}

/**
 * Log an API error
 */
export function logError(
  method: string,
  path: string,
  error: unknown,
  userId?: string,
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error({
    type: "api_error",
    method,
    path,
    userId,
    error: message,
    stack,
  });
}

/**
 * Log an audit event (CRUD operations)
 */
export function logAudit(
  action: string,
  entity: string,
  entityId: string,
  userId: string,
  schoolId: string,
  details?: Record<string, unknown>,
) {
  logger.info({
    type: "audit",
    action,
    entity,
    entityId,
    userId,
    schoolId,
    ...details,
  });
}

export default logger;
