import { global } from './global';
import { DEBUG_ERROR, DEBUG_WARN, DEBUG_LOG } from './consts';

export class Debug {
  private prefix: string;

  public constructor(prefix: string) {
    this.prefix = prefix;
  }

  public log(message?: any, ...optionalParams: any[]) {
    if (global.debugLevel < DEBUG_LOG) {
      return;
    }

    console.log(`[${this.prefix}]`, message, ...optionalParams);
  }

  public warn(message?: any, ...optionalParams: any[]) {
    if (global.debugLevel < DEBUG_WARN) {
      return;
    }

    console.warn(`[${this.prefix}]`, message, ...optionalParams);
  }

  public error(message?: any, ...optionalParams: any[]) {
    if (global.debugLevel < DEBUG_ERROR) {
      return;
    }

    console.error(`[${this.prefix}]`, message, ...optionalParams);
  }

  public panic(message: string): never {
    throw new Error(`[${this.prefix}] ${message}`);
  }
}
