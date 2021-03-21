import {
  ComcatCommands,
  ComcatCommandReplys,
  ComcatCommandPipeReceive,
  ComcatTransportMode,
} from '../type';
import { ComcatRPC } from './rpc';
import { getTransport } from './transport';

interface ComcatPipeOptions {
  topic: string | RegExp;
  transport: ComcatTransportMode;
}

export abstract class ComcatPipe {
  private readonly id: number;
  private readonly rpc: ComcatRPC<ComcatCommands, ComcatCommandReplys>;
  private readonly topic: string | RegExp;
  private status: 'idle' | 'working' = 'idle';

  public constructor(options: ComcatPipeOptions) {
    const { topic, transport } = options;

    this.topic = topic;

    this.rpc = new ComcatRPC(getTransport(transport));
    this.rpc.onRemoteCall = this.onCall.bind(this);

    this.id = Date.now();

    window.addEventListener('unload', this.onDispose.bind(this));
  }

  public async start(): Promise<boolean> {
    if (this.status === 'working') {
      return false;
    }

    try {
      await this.rpc.call({
        name: 'pipe_register',
        params: {
          id: this.id,
        },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  protected abstract dispose(): void;
  protected abstract onMessage(topic: string, data: unknown): void;

  private onCall(cmd: ComcatCommands, reply: (payload: unknown) => void) {
    switch (cmd.name) {
      case 'pipe_receive':
        return this.onReceive(cmd);

      default:
        break;
    }
  }

  private onDispose() {
    this.dispose();

    this.rpc.call({
      name: 'pipe_close',
      oneshot: true,
      params: { id: this.id },
    });
    this.rpc.close();
  }

  private onReceive(cmd: ComcatCommandPipeReceive) {
    const { topic, data } = cmd.params;

    const filter = this.topic;
    if (typeof filter === 'string') {
      if (filter !== topic) {
        return;
      }
    } else if (!filter.test(topic)) {
      return;
    }

    this.onMessage(topic, data);
  }
}
