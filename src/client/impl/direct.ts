import {
  ComcatBroadcastMessage,
  ComcatCommandPipeClose,
  ComcatCommandPipeReceive,
  ComcatCommandPipeRegister,
  ComcatCommandReplies,
  ComcatCommands,
  ComcatRPCProtocol,
  ComcatTransport,
} from '../../type';
import { Debug } from '../debug';
import {
  RaftResponseElect,
  RaftResponseHeartbeat,
  RaftResponseMessaging,
} from '../raft';
import { ComcatRPC } from '../rpc';

const debug = new Debug('comcat-transport-direct');

interface ComcatPipeRegistry {
  id: string;
  topic: RegExp;
  rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
}

class DirectScheduler {
  private pipes: ComcatPipeRegistry[] = [];

  public constructor() {
    this.onRegister = this.onRegister.bind(this);
    this.postMessage = this.postMessage.bind(this);
  }

  public connect(transport: ComcatTransportDirectSchedulerProxy) {
    const rpc = new ComcatRPC<ComcatCommands, ComcatCommandReplies>(transport);
    rpc.onRemoteCall = (msg, reply) => this.onRegister(rpc, msg, reply);
  }

  public postMessage(command: ComcatCommands, reply: (payload: any) => void) {
    switch (command.name) {
      /**
       * In `direct` mode, since all transport happens within the context of
       * same tab, there is no need to elect a leader and so forth. So we just
       * accept all requests.
       */
      case 'pump_raft_elect':
        const resElect: RaftResponseElect = {
          isGranted: true,
          term: 0,
        };
        return reply(resElect);
      case 'pump_raft_heartbeat':
        const resHeartbeat: RaftResponseHeartbeat = {
          isExpired: false,
          term: 0,
        };
        return reply(resHeartbeat);
      case 'pump_raft_messaging':
        const message = command.params.raft.message;
        this.broadcast(message);

        const resMessaging: RaftResponseMessaging = {
          isExpired: false,
          term: 0,
        };
        return reply(resMessaging);

      // We don't keep track of pumps so just drop it.
      case 'pump_close':
        break;

      case 'pipe_close':
        return this.unregisterPipe(command);

      default:
        break;
    }
  }

  private broadcast(message: ComcatBroadcastMessage) {
    const topic = message.topic;

    for (const pipe of this.pipes) {
      const topicFilter = pipe.topic;
      if (!topicFilter.test(topic)) {
        continue;
      }

      const command: ComcatCommandPipeReceive = {
        name: 'pipe_receive',
        oneshot: true,
        params: message,
      };

      pipe.rpc.call(command);
    }
  }

  private onRegister(
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>,
    msg: ComcatCommands,
    reply: (payload: any) => void
  ) {
    switch (msg.name) {
      case 'pump_register':
        // We don't keep track of pumps so it should be always success.
        rpc.onRemoteCall = this.postMessage;
        return reply(true);

      case 'pipe_register':
        rpc.onRemoteCall = this.postMessage;
        return this.registerPipe(rpc, msg);

      default:
        break;
    }
  }

  private registerPipe(
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>,
    command: ComcatCommandPipeRegister
  ) {
    const { id, topic } = command.params;

    const pipe = this.pipes.find((p) => p.id === id);
    if (pipe) {
      return false;
    }

    const topicFilter = new RegExp(topic);
    const registry: ComcatPipeRegistry = {
      id,
      topic: topicFilter,
      rpc,
    };
    this.pipes.push(registry);
  }

  private unregisterPipe(command: ComcatCommandPipeClose) {
    const { id } = command.params;

    const index = this.pipes.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.pipes.splice(index, 1);
    }
  }
}
const scheduler = new DirectScheduler();

export class ComcatTransportDirect implements ComcatTransport {
  public onMessage: (message: ComcatRPCProtocol) => void = () => {};

  private proxy: ComcatTransportDirectSchedulerProxy;

  public constructor() {
    this.proxy = new ComcatTransportDirectSchedulerProxy(this);
  }

  public connect(): void {
    // Nothing
  }

  public disconnect(): void {
    // Nothing
  }

  public postMessage(message: any): void {
    debug.log(`[out]`, message);

    this.proxy.onMessage(message);
  }
}

class ComcatTransportDirectSchedulerProxy implements ComcatTransport {
  public onMessage: (message: ComcatRPCProtocol) => void = () => {};

  private proxy: ComcatTransportDirect;

  public constructor(proxy: ComcatTransportDirect) {
    this.proxy = proxy;
    scheduler.connect(this);
  }

  public connect(): void {
    // Nothing
  }

  public disconnect(): void {
    // Nothing
  }

  public postMessage(message: any): void {
    debug.log(`[loop-back]`, message);

    setTimeout(() => this.proxy.onMessage(message));
  }
}
