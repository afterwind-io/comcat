export interface ComcatPipeOptions {
  topic?: string | RegExp;
}

export declare abstract class ComcatPipe {
  private readonly id;
  private readonly rpc;
  private readonly topic;
  private status;
  constructor(options: ComcatPipeOptions);
  start(): Promise<boolean>;
  protected abstract onMessage(topic: string, data: unknown): void;
  private onCall;
  private onDispose;
  private onReceive;
}

export interface ComcatPumpOptions {
  category: string;
}

export declare abstract class ComcatPump {
  private readonly category;
  private readonly id;
  private readonly mode;
  private readonly rpc;
  private status;
  constructor(options: ComcatPumpOptions);
  start(): Promise<boolean>;
  stop(): void;
  protected abstract connect(): void;
  protected abstract disconnect(): void;
  protected pump(topic: string, data: any): Promise<never>;
  private onCall;
  private onOpen;
  private onDispose;
}

type ComcatWorkingMode = 'default' | 'legacy' | 'direct';

export declare const Comcat: {
  /**
   * Determines whether enabling the full debug logging,
   * including inner status and transport information.
   *
   * May output enormous content, so be careful.
   *
   * @param {boolean} flag
   */
  enableDebug(flag: boolean): void;
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
   * When running in `direct` Mode, all cross-tab features are disabled due to
   * lack of cross-tab ability. The connection activated by `pump` is created
   * per tab. The messages sent by `pump` are broadcasted back to the pipes
   * on the same tab. Thus, it behaves just like a normal event bus.
   *
   * @param {ComcatWorkingMode} mode
   */
  setMode(mode: ComcatWorkingMode): void;
};
