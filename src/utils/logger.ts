
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: any;
}

const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  private executeLog(level: LogLevel, message: string, context?: any) {
    const logData: LogData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      context,
    };

    // In production, we only log errors and warnings to console
    // In dev, we log everything
    if (!isProduction || level === 'error' || level === 'warn') {
      const consoleMethod = level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error';
      
      if (context) {
        console[consoleMethod](`[${logData.timestamp}] [${level.toUpperCase()}] ${message}`, context);
      } else {
        console[consoleMethod](`[${logData.timestamp}] [${level.toUpperCase()}] ${message}`);
      }
    }

    // Future enhancement: Send logs to an external service like Sentry, Axiom, or Logtail
  }

  info(message: string, context?: any) {
    this.executeLog('info', message, context);
  }

  warn(message: string, context?: any) {
    this.executeLog('warn', message, context);
  }

  error(message: string, context?: any) {
    this.executeLog('error', message, context);
  }

  debug(message: string, context?: any) {
    this.executeLog('debug', message, context);
  }

  // Add compatibility with old logger
  log(message: string, context?: any) {
    this.info(message, context);
  }
}

export const logger = new Logger();
