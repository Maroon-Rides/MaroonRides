export enum LogLevel {
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

class Logger {
  private outputLogLevel: LogLevel;
  private prefix: string;

  constructor(prefix: string, outputLogLevel: LogLevel) {
    this.outputLogLevel = outputLogLevel;
    this.prefix = prefix;
  }

  d(message: string) {
    this._print(message, LogLevel.DEBUG);
  }

  e(message: string) {
    this._print(message, LogLevel.ERROR);
  }

  w(message: string) {
    this._print(message, LogLevel.WARN);
  }

  i(message: string) {
    this._print(message, LogLevel.INFO);
  }

  _print(message: string, logLevel: LogLevel) {
    if (logLevel < this.outputLogLevel) return;

    console.log(`[${LogLevel[logLevel]}] ${this.prefix} - ${message}`);
  }
}

const logLevel = LogLevel.INFO;
export const queryLogger = new Logger('QUERY', logLevel);
export const appLogger = new Logger('APP', logLevel);
