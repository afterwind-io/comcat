import { DebugLevel, DEBUG_SILENCE, DEBUG_VERBOSE, DEBUG_WARN } from './consts';

interface ComcatGlobal {
  debugLevel: DebugLevel;
}

export const global: ComcatGlobal = {
  debugLevel: DEBUG_WARN,
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
    global.debugLevel = flag ? DEBUG_VERBOSE : DEBUG_SILENCE;
  },
};
