type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static instance: Logger;
  private logs: Array<{ level: LogLevel; message: string; data?: any; timestamp: Date }> = [];
  private isDebugEnabled = process.env.NODE_ENV === 'development';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, data?: any) {
    if (this.isDebugEnabled) {
      console.debug(`[DEBUG] ${message}`, data);
      this.addLog('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data);
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    console.error(`[ERROR] ${message}`, data);
    this.addLog('error', message, data);
  }

  private addLog(level: LogLevel, message: string, data?: any) {
    this.logs.push({
      level,
      message,
      data,
      timestamp: new Date()
    });

    // Manter apenas os últimos 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
