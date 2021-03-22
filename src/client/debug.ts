import { global } from './global';

export const enum DebugLevel {
  Silence,
  Error,
  Warn,
  Log,
  Verbose,
}

export class Debug {
  private prefix: string;

  public constructor(prefix: string) {
    this.prefix = prefix;
  }

  public log(message?: any, ...optionalParams: any[]) {
    if (global.debugLevel < DebugLevel.Log) {
      return;
    }

    console.log(`[${this.prefix}]`, message, ...optionalParams);
  }

  public warn(message?: any, ...optionalParams: any[]) {
    if (global.debugLevel < DebugLevel.Warn) {
      return;
    }

    console.warn(`[${this.prefix}]`, message, ...optionalParams);
  }

  public error(message?: any, ...optionalParams: any[]) {
    if (global.debugLevel < DebugLevel.Error) {
      return;
    }

    console.error(`[${this.prefix}]`, message, ...optionalParams);
  }

  public panic(message: string): never {
    throw new Error(`[${this.prefix}] ${message}`);
  }
}
