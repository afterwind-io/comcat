export const enum DebugLevel {
  Silence,
  Error,
  Warn,
  Log,
  Verbose,
}

const DEBUG_LEVEL = (function () {
  try {
    const level = localStorage.getItem('__comcat_debug__');

    switch (level) {
      case 'silence':
        return DebugLevel.Silence;
      case 'error':
        return DebugLevel.Error;
      case 'warn':
        return DebugLevel.Warn;
      case 'log':
        return DebugLevel.Log;
      case 'verbose':
        return DebugLevel.Verbose;
      default:
        return DebugLevel.Silence;
    }
  } catch (error) {
    return DebugLevel.Silence;
  }
})();

export class Debug {
  private prefix: string;

  public constructor(prefix: string) {
    this.prefix = prefix;
  }

  public log(message?: any, ...optionalParams: any[]) {
    if (DEBUG_LEVEL < DebugLevel.Log) {
      return;
    }

    console.log(`[${this.prefix}]`, message, ...optionalParams);
  }

  public warn(message?: any, ...optionalParams: any[]) {
    if (DEBUG_LEVEL < DebugLevel.Warn) {
      return;
    }

    console.warn(`[${this.prefix}]`, message, ...optionalParams);
  }

  public error(message?: any, ...optionalParams: any[]) {
    if (DEBUG_LEVEL < DebugLevel.Error) {
      return;
    }

    console.error(`[${this.prefix}]`, message, ...optionalParams);
  }

  public panic(message: string): never {
    throw new Error(`[${this.prefix}] ${message}`);
  }
}
