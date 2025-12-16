import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../../config';

// Folder paths for logs
const logDir = path.join(__dirname, '../logs');

// Single, consistent log format for all transports
const logFormatter = winston.format.printf(info => {
    const { timestamp, level, stack, message } = info;
    // Use stack trace for errors if available, otherwise use message
    const logMessage = stack || message;
    return `[${timestamp}] ${level.toUpperCase()}: ${logMessage}`;
});

// Base format configuration used by all transports
const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Include stack traces for errors
    logFormatter
);

// Daily Rotate File for debug logs
const debugTransport = new winston.transports.DailyRotateFile({
    filename: `${logDir}/debug/debug-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'debug',
    maxFiles: '14d', // Keep logs for 14 days
    format: baseFormat,
});

// Daily Rotate File for error logs
const errorTransport = new winston.transports.DailyRotateFile({
    filename: `${logDir}/error/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d', // Keep error logs for 30 days
    format: baseFormat,
});

// Console transport for development with colorization
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        baseFormat
    ),
});

// Winston Logger Configuration
const logger = winston.createLogger({
    level: config.logging.level,
    transports: [consoleTransport, debugTransport, errorTransport],
});

export default logger;
