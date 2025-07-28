// 統一的日誌管理系統
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// 日誌數據類型
export type LogData = Record<string, unknown> | string | number | boolean | null | Error | unknown;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: LogData;
  component?: string;
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    // 開發環境顯示所有日誌，生產環境只顯示錯誤和警告
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, component?: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const componentPrefix = component ? `[${component}] ` : '';
    return `${timestamp} [${levelName}] ${componentPrefix}${message}`;
  }

  private log(level: LogLevel, message: string, data?: LogData, component?: string): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, component);
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component,
    };

    switch (level) {
      case LogLevel.ERROR:
        if (data) {
          console.error(formattedMessage, data);
        } else {
          console.error(formattedMessage);
        }
        break;
      case LogLevel.WARN:
        if (data) {
          console.warn(formattedMessage, data);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        if (data) {
          console.info(formattedMessage, data);
        } else {
          console.info(formattedMessage);
        }
        break;
      case LogLevel.DEBUG:
        if (data) {
          console.log(formattedMessage, data);
        } else {
          console.log(formattedMessage);
        }
        break;
    }

    // 在開發環境中可以添加到日誌收集器
    if (this.isDevelopment) {
      this.storeLogEntry(logEntry);
    }
  }

  private storeLogEntry(entry: LogEntry): void {
    // 可以實現本地存儲或發送到外部日誌服務
    // 這裡暫時留空，未來可以擴展
  }

  // 公共日誌方法
  error(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.ERROR, message, data, component);
  }

  warn(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.WARN, message, data, component);
  }

  info(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.INFO, message, data, component);
  }

  debug(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.DEBUG, message, data, component);
  }

  // 性能監控專用方法
  performance(componentName: string, renderCount: number, timeSinceLastRender: number): void {
    this.debug(
      `Component rendered`,
      { renderCount, timeSinceLastRender },
      componentName
    );
  }

  timer(name: string, duration: number): void {
    this.debug(`Timer completed`, { duration: `${duration.toFixed(2)}ms` }, name);
  }

  // 設置日誌級別
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }
}

// 創建全域日誌實例
export const logger = new Logger();

// 便利方法
export const log = {
  error: (message: string, data?: LogData, component?: string) => logger.error(message, data, component),
  warn: (message: string, data?: LogData, component?: string) => logger.warn(message, data, component),
  info: (message: string, data?: LogData, component?: string) => logger.info(message, data, component),
  debug: (message: string, data?: LogData, component?: string) => logger.debug(message, data, component),
}; 