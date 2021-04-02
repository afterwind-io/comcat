import {
  ComcatCommands,
  ComcatCommandReplies,
  ComcatPumpMode,
  ComcatBroadcastMessage,
} from '../type';
import { ComcatRPC } from './rpc';
import { getTransport } from './transport';
import { Debug } from './debug';
import { getUniqueId } from './util';
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

interface ComcatPumpOptions {
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
   * @type {ComcatPumpMode}
   * @memberof ComcatPumpOptions
   */
  mode?: ComcatPumpMode;
}

/**
 * The base class for constructing `Comcat` pumps.
 *
 * @export
 * @class ComcatPump
 */
export class ComcatPump {
  private readonly category: string;
  private readonly id: string;
  private readonly mode: ComcatPumpMode;
  private readonly rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
  private readonly raft: RaftActor<ComcatBroadcastMessage>;
  private status: 'idle' | 'sleep' | 'working' = 'idle';

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

    window.addEventListener('unload', this.onDispose);
  }

  /**
   * **The default method is only a placeholder. Always override with your own callback.**
   *
   * ---
   *
   * Invoked when `Comcat` tries to connect to your backend.
   *
   * @virtual
   * @memberof ComcatPump
   */
  public onConnect = () => {
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
   * because your pump may be rearranged connecting again.
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

    try {
      const isRegistryValid = await this.rpc.call({
        name: 'pump_register',
        params: {
          id: this.id,
          mode: this.mode,
          category: this.category,
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
    if (!this.raft.IsLeader) {
      return;
    }

    return this.raft.RequestMessaging({ topic, data });
  }

  private onDispose = () => {
    this.onDisconnect();

    this.rpc.call({
      name: 'pump_close',
      oneshot: true,
      params: { id: this.id, category: this.category },
    });
    this.rpc.close();
  };

  private onRaftBecomeLeader = () => {
    // FIXME connect过程有可能是异步的
    this.onConnect();
    this.status = 'working';

    debug.log(`pump "${this.category}-${this.id}" activated.`);
  };

  private onRaftBecomeCandidate = () => {
    this.onDisconnect();
    this.status = 'sleep';

    debug.log(`pump "${this.category}-${this.id}" inactivated.`);
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
