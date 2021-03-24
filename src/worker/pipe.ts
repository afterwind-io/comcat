import { ComcatRPC } from '../client/rpc';
import {
  ComcatBroadcastMessage,
  ComcatCommandPipeClose,
  ComcatCommandPipeReceive,
  ComcatCommandPipeRegister,
  ComcatCommandReplies,
  ComcatCommands,
} from '../type';

interface ComcatPipeRegistry {
  id: string;
  topic: RegExp;
  rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
}

export class ComcatPipeScheduler {
  private pipes: ComcatPipeRegistry[] = [];

  public broadcast(message: ComcatBroadcastMessage) {
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

  public register(
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>,
    cmd: ComcatCommandPipeRegister
  ): boolean {
    const { id, topic } = cmd.params;

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

    rpc.onRemoteCall = this.onCall.bind(this);
    return true;
  }

  private onCall(msg: ComcatCommands, reply: (payload: any) => void) {
    switch (msg.name) {
      case 'pipe_close':
        return this.onClose(msg);

      default:
        break;
    }
  }

  private onClose(cmd: ComcatCommandPipeClose) {
    const { id } = cmd.params;

    const index = this.pipes.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.pipes.splice(index, 1);
    }
  }
}
