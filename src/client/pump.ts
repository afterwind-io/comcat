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
  category: string;
  mode: ComcatPumpMode;
}

export abstract class ComcatPump {
  private readonly category: string;
  private readonly id: string;
  private readonly mode: ComcatPumpMode;
  private readonly rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
  private readonly raft: RaftActor<ComcatBroadcastMessage>;
  private status: 'idle' | 'sleep' | 'working' = 'idle';

  public constructor(options: ComcatPumpOptions) {
    const { category, mode } = options;

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

  protected abstract connect(): void;
  protected abstract disconnect(): void;

  protected async pump(topic: string, data: any): Promise<void> {
    if (!this.raft.IsLeader) {
      return;
    }

    return this.raft.RequestMessaging({ topic, data });
  }

  private onDispose = () => {
    this.disconnect();

    this.rpc.call({
      name: 'pump_close',
      oneshot: true,
      params: { id: this.id, category: this.category },
    });
    this.rpc.close();
  };

  private onRaftBecomeLeader = () => {
    // FIXME connect过程有可能是异步的
    this.connect();
    this.status = 'working';

    debug.log(`pump "${this.category}-${this.id}" activated.`);
  };

  private onRaftBecomeCandidate = () => {
    this.disconnect();
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
