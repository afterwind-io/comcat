import { ComcatRPC } from '../../rpc';
import {
  ComcatBroadcastMessage,
  ComcatCommandPipeRegister,
  ComcatCommandReplies,
  ComcatCommands,
} from '../../type';
import { PipeScheduler } from '../shared/pipeScheduler';

export class ComcatPipeScheduler {
  private scheduler: PipeScheduler = new PipeScheduler();

  public broadcast(message: ComcatBroadcastMessage) {
    return this.scheduler.broadcast(message);
  }

  public register(
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>,
    cmd: ComcatCommandPipeRegister
  ): boolean {
    const { id, topic } = cmd.params;

    const isSucceeded = this.scheduler.register(id, topic, rpc);
    if (isSucceeded) {
      rpc.onRemoteCall = this.onCall;
    }

    return isSucceeded;
  }

  private onCall = (command: ComcatCommands, reply: (payload: any) => void) => {
    switch (command.name) {
      case 'pipe_close':
        return this.scheduler.unregister(command.params.id);

      default:
        break;
    }
  };
}
