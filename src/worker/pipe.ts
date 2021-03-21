import { ComcatRPC } from '../client/rpc';
import {
  ComcatBroadcastMessage,
  ComcatCommandPipeClose,
  ComcatCommandPipeReceive,
  ComcatCommandPipeRegister,
  ComcatCommands,
} from '../type';

interface ComcatPipeRegistry {
  id: number;
  rpc: ComcatRPC<ComcatCommands, any>;
}

export class ComcatPipeScheduler {
  private pipes: ComcatPipeRegistry[] = [];

  public broadcast(message: ComcatBroadcastMessage) {
    for (const pipe of this.pipes) {
      const command: ComcatCommandPipeReceive = {
        name: 'pipe_receive',
        oneshot: true,
        params: message,
      };

      pipe.rpc.call(command);
    }
  }

  public register(
    rpc: ComcatRPC<ComcatCommands, any>,
    cmd: ComcatCommandPipeRegister
  ): boolean {
    const { id } = cmd.params;

    const pipe = this.pipes.find((p) => p.id === id);
    if (pipe) {
      return false;
    }

    const registry: ComcatPipeRegistry = {
      id,
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
