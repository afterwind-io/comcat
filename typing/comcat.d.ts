export interface ComcatPipeOptions {
  /**
   * The expected category of the messages.
   *
   * It can be either `string` or `RegExp`. If applied, the incoming message
   * is filtered unless its topic exactly matches the provided string,
   * or passes the `RegExp` test.
   *
   * @type {(string | RegExp)}
   * @memberof ComcatPipeOptions
   */
  topic?: string | RegExp;
}

/**
 * The base class for constructing `Comcat` pipes.
 *
 * @export
 * @class ComcatPipe
 */
export declare class ComcatPipe {
  constructor(options: ComcatPipeOptions);
  /**
   * Register the pipe and start listening for the messages from the upstream.
   *
   * @returns {Promise<boolean>} A flag indicates whether the registry succeeds or not.
   * @memberof ComcatPipe
   */
  start(): Promise<boolean>;
  /**
   * **The default method is only a placeholder. Always override with your own.**
   *
   * ---
   *
   * Invoked when messages arrive.
   *
   * Note that the messages arrives here have already been filtered
   * by the `topic` provided in construction options.
   *
   * @param {string} topic The topic of the message
   * @param {unknown} data The content of the message
   * @virtual
   * @memberof ComcatPipe
   */
  onMessage(topic: string, data: unknown): void;
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
