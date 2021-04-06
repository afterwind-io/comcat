import { DebugLevel, DEBUG_SILENCE, DEBUG_VERBOSE, DEBUG_WARN } from './consts';

type ComcatWorkingMode = 'default' | 'legacy' | 'direct';

interface ComcatGlobal {
  debugLevel: DebugLevel;
  mode: ComcatWorkingMode;
}

export const global: ComcatGlobal = {
  debugLevel: DEBUG_WARN,
  mode: 'default',
};

export const ComcatGlobal = {
  /**
   * Determines whether enabling the full debug logging,
   * including inner status and transport information.
   *
   * May output enormous content, so be careful.
   *
   * @param {boolean} flag
   */
  enableDebug(flag: boolean) {
    global.debugLevel = flag ? DEBUG_VERBOSE : DEBUG_SILENCE;
  },
  /**
   * Specify the underlying implementation.
   *
   * - "default": use `SharedWebworker`. The *default* behavior;
   * - "legacy": **DO NOT USE** Not implemented yet;
   * - "direct": use tab-isolated messaging. See below;
   *
   * By default `Comcat` uses `SharedWebworker` to share connection and send
   * messages across tabs/windows. If `SharedWebworker` is not supported,
   * `Comcat` will fall back to the `direct` mode.
   * 
   * When running in `direct` Mode, all cross-tab features are disabled.
   * The connection activated by `pump` is created per tab.
   * The messages sent by `pump` are broadcasted back to the pipes
   * on the same tab. Thus, it behaves just like a normal event bus.
   *
   * @param {ComcatWorkingMode} mode
   */
  setMode(mode: ComcatWorkingMode) {
    global.mode = mode;
  },
};
