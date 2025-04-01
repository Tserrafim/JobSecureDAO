import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`
});

export const Log = {
  info: (message: string, data?: object) => logger.info(data, message),
  warn: (message: string, data?: object) => logger.warn(data, message),
  error: (message: string, error?: Error) => {
    logger.error({
      err: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      }
    }, message);
  },
  debug: (message: string, data?: object) => logger.debug(data, message)
};