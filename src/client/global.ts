import { DebugLevel } from './debug';

interface ComcatGlobal {
  debugLevel: DebugLevel;
}

export const global: ComcatGlobal = {
  debugLevel: DebugLevel.Warn,
};

export const ComcatGlobal = {
  /**
   * Determines whether enabling the full debug logging,
   * including inner status and transport information.
   *
   * May output too much logs, so be careful.
   *
   * @param {boolean} flag
   */
  enableDebug(flag: boolean) {
    global.debugLevel = flag ? DebugLevel.Verbose : DebugLevel.Silence;
  },
};
