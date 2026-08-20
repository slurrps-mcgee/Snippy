import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../../config';

const logDir = path.join(__dirname, '../logs');
const isProduction = config.server.nodeEnv === 'production';

const textFormatter = winston.format.printf((info) => {
  const { timestamp, level, stack, message, requestId, ...rest } = info;
  const logMessage = stack || message;
  const extras = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
  const req = requestId ? ` [${requestId}]` : '';
  return `[${timestamp}] ${level.toUpperCase()}${req}: ${logMessage}${extras}`;
});

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const textFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  textFormatter
);

const fileFormat = isProduction ? jsonFormat : textFormat;

const debugTransport = new winston.transports.DailyRotateFile({
  filename: `${logDir}/debug/debug-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  level: 'debug',
  maxFiles: '14d',
  format: fileFormat,
});

const errorTransport = new winston.transports.DailyRotateFile({
  filename: `${logDir}/error/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',
  format: fileFormat,
});

const consoleTransport = new winston.transports.Console({
  format: isProduction ? jsonFormat : winston.format.combine(winston.format.colorize(), textFormat),
});

const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'snippy-api' },
  transports: [consoleTransport, debugTransport, errorTransport],
});

export default logger;
