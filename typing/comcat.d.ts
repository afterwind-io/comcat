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
  onMessage: (topic: string, data: unknown) => void;
}

export interface ComcatPumpOptions {
  /**
   * An identifier to classify different message sources.
   *
   * Each category is coupled with only one type of connection,
   * so you can not create multiple pumps with same category.
   *
   * @type {string}
   * @memberof ComcatPumpOptions
   */
  category: string;
}

/**
 * The base class for constructing `Comcat` pumps.
 *
 * @export
 * @class ComcatPump
 */
export declare abstract class ComcatPump {
  constructor(options: ComcatPumpOptions);
  /**
   * **The default method is only a placeholder. Always override with your own callback.**
   *
   * ---
   *
   * Invoked when `Comcat` tries to connect to your backend.
   *
   * You can fine-tune the inner behavior by returning a flag indicates
   * whether the connection is successful.
   *
   * If the return value is `false`, or an error is raised,
   * `Comcat` will either retry the connection after a short period of time,
   * or schedule another tab to do the job.
   *
   * If no value is returned, `Comcat` will treat the result as successful anyway.
   *
   * @virtual
   * @memberof ComcatPump
   */
  onConnect: () => void;
  /**
   * **The default method is only a placeholder. Always override with your own callback.**
   *
   * ---
   *
   * Invoked when `Comcat` tries to disconnect to your backend.
   *
   * Don't permanently dispose anything here,
   * because your pump may be rescheduled connecting again.
   *
   * @virtual
   * @memberof ComcatPump
   */
  onDisconnect: () => void;
  /**
   * Register the pump and try to start the underlying connection.
   *
   * Because the connection is managed by `Comcat`,
   * it may be postponed until scheduled.
   *
   * @returns {Promise<boolean>} A flag indicates whether the registry succeeds or not.
   * @memberof ComcatPump
   */
  start(): Promise<boolean>;
  /**
   * Send the message with a specified topic.
   *
   * @param {string} topic
   * The category of the message.
   * It is used to help filtering messages in different aspects.
   *
   * @param {*} data
   * The content of the message.
   * Can be anything that `SharedWorker` supports, but with some restrictions.
   * Please see [_Transferring data to and from workers: further details_](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#transferring_data_to_and_from_workers_further_details)
   *
   * @returns {Promise<void>}
   * @memberof ComcatPump
   */
  pump(topic: string, data: any): Promise<void>;
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
   * When running in `direct` Mode, all cross-tab features are disabled.
   * The connection activated by `pump` is created per tab.
   * The messages sent by `pump` are broadcasted back to the pipes
   * on the same tab. Thus, it behaves just like a normal event bus.
   *
   * @param {ComcatWorkingMode} mode
   */
  setMode(mode: ComcatWorkingMode): void;
};
