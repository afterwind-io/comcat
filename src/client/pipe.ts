import {
  ComcatCommands,
  ComcatCommandReplies,
  ComcatCommandPipeReceive,
} from '../type';
import { ComcatRPC } from './rpc';
import { getTransport } from './transport';
import { getUniqueId } from './util';

interface ComcatPipeOptions {
  topic?: string | RegExp;
}

export abstract class ComcatPipe {
  private readonly id: string;
  private readonly rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
  private readonly topic: string | RegExp | null;
  private status: 'idle' | 'working' = 'idle';

  public constructor(options: ComcatPipeOptions) {
    const { topic = null } = options;

    this.topic = topic;

    this.rpc = new ComcatRPC(getTransport());
    this.rpc.onRemoteCall = this.onCall.bind(this);

    this.id = getUniqueId();

    window.addEventListener('unload', this.onDispose.bind(this));
  }

  public async start(): Promise<boolean> {
    if (this.status === 'working') {
      return false;
    }

    try {
      const topic = this.topic;
      const topicFilter = getTopicRepr(topic);

      await this.rpc.call({
        name: 'pipe_register',
        params: {
          id: this.id,
          topic: topicFilter,
        },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

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
    this.rpc.call({
      name: 'pipe_close',
      oneshot: true,
      params: { id: this.id },
    });
    this.rpc.close();
  }

  private onReceive(cmd: ComcatCommandPipeReceive) {
    const { topic, data } = cmd.params;
    this.onMessage(topic, data);
  }
}

function getTopicRepr(topic: string | RegExp | null): string | null {
  if (topic == null || typeof topic == 'string') {
    return topic;
  }

  return topic.source;
}
