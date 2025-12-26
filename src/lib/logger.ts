
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: any;
}

const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  private isLogging = false;

  private log(level: LogLevel, message: string, context?: any) {
    if (this.isLogging) return;
    this.isLogging = true;

    try {
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
    } finally {
      this.isLogging = false;
    }

    // Future enhancement: Send logs to an external service like Sentry, Axiom, or Logtail
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  error(message: string, context?: any) {
    this.log('error', message, context);
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
