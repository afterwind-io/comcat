import {
  ComcatCommands,
  ComcatCommandReplies,
  ComcatPumpMode,
  ComcatBroadcastMessage,
} from './type';
import { ComcatRPC } from './rpc';
import { getTransport } from './impl';
import { Debug } from './debug';
import { blackhole, getUniqueId } from './util';
import {
  RaftActor,
  RaftRequestElect,
  RaftRequestHeartbeat,
  RaftRequestMessaging,
  RaftResponseElect,
  RaftResponseHeartbeat,
  RaftResponseMessaging,
} from './raft';

const debug = new Debug('comcat-pump');

/**
 * Options for creating a `ComcatPump`.
 *
 * @public
 * @export
 * @interface ComcatPumpOptions
 */
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
  /**
   * **NOT IMPLEMENTED**
   *
   * Specify the strategy of connection management.
   *
   * - `unique`
   *
   * Indicates that only one connection created by this pump
   * should be kept alive across all tabs.
   *
   * - `standalone`
   *
   * The connection is kept alive per tab and created
   * as soon as this pump starts.
   *
   * @deprecated
   * @alpha
   * @type {ComcatPumpMode}
   * @memberof ComcatPumpOptions
   */
  mode?: ComcatPumpMode;
}

/**
 * The base class for constructing `Comcat` pumps.
 *
 * @public
 * @export
 * @class ComcatPump
 */
export class ComcatPump {
  private static categoryRegistry: Record<string, boolean> = {};

  private readonly category: string;
  private readonly id: string;
  private readonly mode: ComcatPumpMode;
  private readonly rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
  private readonly raft: RaftActor<ComcatBroadcastMessage>;
  private status: 'idle' | 'sleep' | 'working' | 'closed' = 'idle';

  public constructor(options: ComcatPumpOptions) {
    const { category, mode = 'unique' } = options;

    this.category = category;
    this.mode = mode;

    this.rpc = new ComcatRPC(getTransport());

    this.raft = new RaftActor();
    this.raft.onBecomeLeader = this.onRaftBecomeLeader;
    this.raft.onBecomeCandidate = this.onRaftBecomeCandidate;
    this.raft.onElect = this.onRaftElect;
    this.raft.onHeartbeat = this.onRaftHeartbeat;
    this.raft.onMessaging = this.onRaftMessaging;

    this.id = getUniqueId();

    window.addEventListener('unload', this.onClose);
  }

  private get tag(): string {
    return `${this.category}-${this.id}`;
  }

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
  public onConnect = (): Promise<boolean> | void => {
    debug.error(
      `DO NOT use the default "ComcatPump.onConnect" method.` +
        `It is only a placeholder, and you should always provide your own callback.`
    );
  };

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
  public onDisconnect = () => {
    debug.error(
      `DO NOT use the default "ComcatPump.onDisconnect" method.` +
        `It is only a placeholder, and you should always provide your own callback.`
    );
  };

  /**
   * Register the pump and try to start the underlying connection.
   *
   * Because the connection is managed by `Comcat`,
   * it may be postponed until scheduled.
   *
   * @returns {Promise<boolean>} A flag indicates whether the registry succeeds or not.
   * @memberof ComcatPump
   */
  public async start(): Promise<boolean> {
    if (this.status !== 'idle') {
      return false;
    }

    const category = this.category;
    if (ComcatPump.categoryRegistry[category]) {
      debug.error(`Can not create multiple pumps with category "${category}"`);

      return false;
    }
    ComcatPump.categoryRegistry[category] = true;

    try {
      const isRegistryValid = await this.rpc.call({
        name: 'pump_register',
        params: {
          id: this.id,
          mode: this.mode,
          category,
        },
      });
      if (!isRegistryValid) {
        return false;
      }

      this.raft.start();

      return true;
    } catch (error) {
      debug.error(error);

      return false;
    }
  }

  /**
   * Close the pump and the underlying connection.
   *
   * In practice, `Comcat` will close the pump when the current tab is closed,
   * so usually you wont need to trigger this by hand.
   *
   * If somehow you still want to do it yourself, please note that once the pump
   * is closed, it is fully disposed and cannot be started again.
   * In order to restarting a new pump with the same category,
   * instantiate a new `ComcatPump`.
   *
   * @memberof ComcatPump
   */
  public stop() {
    this.onClose();
  }

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
  public async pump(topic: string, data: any): Promise<void> {
    if (!this.raft.isLeader) {
      return;
    }

    return this.raft.RequestMessaging({ topic, data });
  }

  private onClose = () => {
    this.onDisconnect();

    this.onConnect = blackhole;
    this.onDisconnect = blackhole;

    this.raft.stop();

    this.rpc.call({
      name: 'pump_close',
      oneshot: true,
      params: { id: this.id },
    });
    this.rpc.close();

    ComcatPump.categoryRegistry[this.category] = false;

    this.status = 'closed';

    debug.log(`pump "${this.tag}" closed.`);
  };

  private onRaftBecomeLeader = async () => {
    let isSucceeded: boolean | void;

    try {
      isSucceeded = (await this.onConnect()) ?? true;
    } catch (error) {
      isSucceeded = false;
    }

    if (!isSucceeded) {
      /**
       * If connection is failed, roll back to candidate.
       *
       * It will either transfer the leadership to another tab,
       * or retry after election timeout.
       */
      this.raft.stepdown();

      debug.warn(`Connection failed. Retrying...`);
    } else {
      this.status = 'working';

      debug.log(`pump "${this.tag}" activated.`);
    }
  };

  private onRaftBecomeCandidate = () => {
    if (this.status !== 'working') {
      return;
    }

    this.onDisconnect();
    this.status = 'sleep';

    debug.log(`pump "${this.tag}" inactivated.`);
  };

  private onRaftElect = (req: RaftRequestElect): Promise<RaftResponseElect> => {
    return this.rpc.call({
      name: 'pump_raft_elect',
      params: { category: this.category, raft: req },
    });
  };

  private onRaftHeartbeat = (
    req: RaftRequestHeartbeat
  ): Promise<RaftResponseHeartbeat> => {
    return this.rpc.call({
      name: 'pump_raft_heartbeat',
      params: { category: this.category, raft: req },
    });
  };

  private onRaftMessaging = (
    req: RaftRequestMessaging<ComcatBroadcastMessage>
  ): Promise<RaftResponseMessaging> => {
    return this.rpc.call({
      name: 'pump_raft_messaging',
      params: { category: this.category, raft: req },
    });
  };
}
