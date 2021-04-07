import { ComcatRPC } from '../../rpc';
import {
  ComcatCommands,
  ComcatCommandReplies,
  ComcatBroadcastMessage,
  ComcatCommandPipeReceive,
} from '../../type';

interface ComcatPipeRegistry {
  id: string;
  topic: RegExp | null;
  rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
}

export class PipeScheduler {
  private pipes: ComcatPipeRegistry[] = [];

  public broadcast(message: ComcatBroadcastMessage) {
    const topic = message.topic;

    for (const pipe of this.pipes) {
      const topicFilter = pipe.topic;
      if (topicFilter && !topicFilter.test(topic)) {
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
    id: string,
    topic: string | null,
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>
  ): boolean {
    const pipe = this.pipes.find((p) => p.id === id);
    if (pipe) {
      return false;
    }

    const topicFilter = topic == null ? topic : new RegExp(topic);
    const registry: ComcatPipeRegistry = {
      id,
      topic: topicFilter,
      rpc,
    };
    this.pipes.push(registry);

    return true;
  }

  public unregister(id: string) {
    const index = this.pipes.findIndex((p) => p.id === id);
    if (index === -1) {
      return;
    }

    const pipe = this.pipes[index];
    pipe.rpc.close();

    this.pipes.splice(index, 1);
  }
}
