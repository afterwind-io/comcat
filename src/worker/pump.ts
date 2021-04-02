import {
  RaftDealer,
  RaftResponseElect,
  RaftResponseHeartbeat,
  RaftResponseMessaging,
} from '../client/raft';
import { ComcatRPC } from '../client/rpc';
import { blackhole } from '../client/util';
import {
  ComcatBroadcastMessage,
  ComcatCommandPumpClose,
  ComcatCommandPumpRaftElect,
  ComcatCommandPumpRaftHeartbeat,
  ComcatCommandPumpRaftMessaging,
  ComcatCommandPumpRegister,
  ComcatCommandReplies,
  ComcatCommands,
  ComcatPumpMode,
} from '../type';

interface ComcatPumpRegistry {
  id: string;
  mode: ComcatPumpMode;
  category: string;
  rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
}

export class ComcatPumpScheduler {
  public onBroadcast: (message: ComcatBroadcastMessage) => void = blackhole;

  private pumps: Map<
    string, // id
    ComcatPumpRegistry
  > = new Map();
  private raftDealers: Map<
    string, // category
    RaftDealer<ComcatBroadcastMessage>
  > = new Map();

  public register(
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>,
    cmd: ComcatCommandPumpRegister
  ): boolean {
    const { id, category, mode } = cmd.params;

    const pump = this.pumps.get(id);
    if (pump) {
      return false;
    }

    const registry: ComcatPumpRegistry = {
      id,
      category,
      mode,
      rpc,
    };
    this.pumps.set(id, registry);

    rpc.onRemoteCall = this.onCall.bind(this);
    return true;
  }

  private getDealer(category: string): RaftDealer<ComcatBroadcastMessage> {
    let dealer = this.raftDealers.get(category);
    if (dealer) {
      return dealer;
    }

    dealer = new RaftDealer();
    dealer.onMessageRequest = this.onBroadcast;
    this.raftDealers.set(category, dealer);

    return dealer;
  }

  private onCall(msg: ComcatCommands, reply: (payload: any) => void) {
    switch (msg.name) {
      case 'pump_raft_elect':
        return this.onRaftElect(msg, reply);

      case 'pump_raft_heartbeat':
        return this.onRaftHeartbeat(msg, reply);

      case 'pump_raft_messaging':
        return this.onRaftMessaging(msg, reply);

      case 'pump_close':
        return this.onClose(msg);

      default:
        break;
    }
  }

  private onClose(cmd: ComcatCommandPumpClose) {
    const { category, id } = cmd.params;

    if (this.pumps.has(id)) {
      this.pumps.delete(id);
    }
  }

  private onRaftElect(
    cmd: ComcatCommandPumpRaftElect,
    reply: (payload: RaftResponseElect) => void
  ) {
    const { category, raft } = cmd.params;

    const dealer = this.getDealer(category);
    dealer.RequestElect(raft, reply);
  }

  private onRaftHeartbeat(
    cmd: ComcatCommandPumpRaftHeartbeat,
    reply: (payload: RaftResponseHeartbeat) => void
  ) {
    const { category, raft } = cmd.params;

    const dealer = this.getDealer(category);
    dealer.RequestHeartbeat(raft, reply);
  }

  private onRaftMessaging(
    cmd: ComcatCommandPumpRaftMessaging,
    reply: (payload: RaftResponseMessaging) => void
  ) {
    const { category, raft } = cmd.params;

    const dealer = this.getDealer(category);
    dealer.RequestMessaging(raft, reply);
  }
}
