import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = process.env.SERVICE_NAME || 'catalog-api';
const CELL_ID = process.env.CELL_ID || 'unknown';

export const logger = pino({
  level: LOG_LEVEL,
  base: {
    service: SERVICE_NAME,
    cell_id: CELL_ID,
    environment: NODE_ENV
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  ...(NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  })
});
